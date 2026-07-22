import { nanoid } from 'nanoid';
import type { Server, Socket } from 'socket.io';
import {
  BATTLE_WEAPONS,
  DEFAULT_MII_CONFIG,
  MII_HAIR_STYLES,
  MII_OUTFIT_STYLES,
} from '@rosco/shared';
import type {
  BattleHostCreateRoomPayload,
  BattlePlayerAnswerPayload,
  BattlePlayerAttackPayload,
  BattlePlayerJoinRoomPayload,
  HostReconnectPayload,
  MiiConfig,
  PlayerReconnectPayload,
  QuizDifficulty,
} from '@rosco/shared';
import {
  createBattleRoomCode,
  deleteBattleRoom,
  findBattleRoomByHostSocket,
  findBattleRoomByPlayerSocket,
  getBattleRoom,
  saveBattleRoom,
} from './battle/rooms.js';
import {
  aliveCount,
  aliveOpponents,
  applyAttack,
  computeBattleRanking,
  createBattlePlayer,
  nextAlivePlayerId,
  toPublicBattleRoom,
} from './battle/engine.js';
import { drawQuizQuestions } from './quiz/pool.js';
import { battlePackRepo } from './packs/repositories.js';
import type { QuizQuestion } from '@rosco/shared';
import type { ServerBattleRoom } from './battle/roomTypes.js';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const QUESTION_DURATION_SECONDS = 20;
const ATTACK_CHOICE_SECONDS = 12;
const REVEAL_SECONDS = 4;
const HOST_RECONNECT_GRACE_MS = 45_000;
const VALID_DIFFICULTIES: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];
const MAX_PHOTO_LENGTH = 300_000;

const VALID_HAIR_STYLES = new Set<string>(MII_HAIR_STYLES.map((h) => h.id));
const VALID_OUTFIT_STYLES = new Set<string>(MII_OUTFIT_STYLES.map((o) => o.id));

function sanitizeMii(input: unknown): MiiConfig {
  const mii = (input ?? {}) as Partial<MiiConfig>;
  return {
    skinTone: typeof mii.skinTone === 'string' ? mii.skinTone : DEFAULT_MII_CONFIG.skinTone,
    hairStyle: VALID_HAIR_STYLES.has(mii.hairStyle as string) ? (mii.hairStyle as MiiConfig['hairStyle']) : DEFAULT_MII_CONFIG.hairStyle,
    hairColor: typeof mii.hairColor === 'string' ? mii.hairColor : DEFAULT_MII_CONFIG.hairColor,
    outfitStyle: VALID_OUTFIT_STYLES.has(mii.outfitStyle as string)
      ? (mii.outfitStyle as MiiConfig['outfitStyle'])
      : DEFAULT_MII_CONFIG.outfitStyle,
    outfitColor: typeof mii.outfitColor === 'string' ? mii.outfitColor : DEFAULT_MII_CONFIG.outfitColor,
    pantsColor: typeof mii.pantsColor === 'string' ? mii.pantsColor : DEFAULT_MII_CONFIG.pantsColor,
    photo: typeof mii.photo === 'string' && mii.photo.length <= MAX_PHOTO_LENGTH ? mii.photo : null,
  };
}

function shuffledIndices(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Extrae la siguiente pregunta del paquete de la sala, sin repetir hasta agotarlo (se rebaraja entonces). */
function drawFromPackQueue(room: ServerBattleRoom): QuizQuestion {
  const questions = room.packQuestions!;
  if (room.packDrawQueue.length === 0) {
    room.packDrawQueue = shuffledIndices(questions.length);
  }
  const idx = room.packDrawQueue.pop()!;
  return questions[idx];
}

function broadcastBattleRoomState(io: Server, room: ServerBattleRoom): void {
  io.to(room.code).emit('battle:roomState', toPublicBattleRoom(room));
}

function scheduleHostDisconnect(io: Server, room: ServerBattleRoom): void {
  room.hostConnected = false;
  broadcastBattleRoomState(io, room);
  if (room.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  room.hostDisconnectTimeout = setTimeout(() => {
    io.to(room.code).emit('battle:roomError', { reason: 'El anfitrión no volvió a tiempo. La partida ha finalizado.' });
    deleteBattleRoom(room.code);
  }, HOST_RECONNECT_GRACE_MS);
}

function finishBattle(io: Server, room: ServerBattleRoom): void {
  if (room.questionTimeout) clearTimeout(room.questionTimeout);
  if (room.attackTimeout) clearTimeout(room.attackTimeout);
  if (room.revealTimeout) clearTimeout(room.revealTimeout);
  room.status = 'finished';
  broadcastBattleRoomState(io, room);
  io.to(room.code).emit('battle:gameFinished', { ranking: computeBattleRanking(room) });
}

function beginQuestion(io: Server, room: ServerBattleRoom): void {
  const question = room.packQuestions ? drawFromPackQueue(room) : drawQuizQuestions(room.difficulty, 1)[0];
  room.currentQuestion = question ?? null;
  room.status = 'question';
  room.questionEndsAt = Date.now() + QUESTION_DURATION_SECONDS * 1000;
  room.attackTargetOptions = null;
  room.attackEndsAt = null;
  room.lastAttack = null;
  room.lastAnswerCorrect = null;
  broadcastBattleRoomState(io, room);
  room.questionTimeout = setTimeout(() => handleNoAnswer(io, room), QUESTION_DURATION_SECONDS * 1000);
}

function resolveReveal(io: Server, room: ServerBattleRoom, attacked: boolean): void {
  room.lastAnswerCorrect = attacked;
  room.status = 'reveal';
  room.attackTargetOptions = null;
  room.attackEndsAt = null;
  room.revealEndsAt = Date.now() + REVEAL_SECONDS * 1000;
  broadcastBattleRoomState(io, room);
  room.revealTimeout = setTimeout(() => {
    if (aliveCount(room) <= 1) {
      finishBattle(io, room);
      return;
    }
    room.activePlayerId = nextAlivePlayerId(room, room.activePlayerId);
    beginQuestion(io, room);
  }, REVEAL_SECONDS * 1000);
}

function handleNoAnswer(io: Server, room: ServerBattleRoom): void {
  if (room.status !== 'question') return;
  if (room.questionTimeout) {
    clearTimeout(room.questionTimeout);
    room.questionTimeout = null;
  }
  resolveReveal(io, room, false);
}

function autoResolveAttack(io: Server, room: ServerBattleRoom): void {
  if (room.status !== 'attacking') return;
  if (room.attackTimeout) {
    clearTimeout(room.attackTimeout);
    room.attackTimeout = null;
  }
  const options = room.attackTargetOptions ?? [];
  const targetId = options[Math.floor(Math.random() * options.length)];
  const weapon = BATTLE_WEAPONS[Math.floor(Math.random() * BATTLE_WEAPONS.length)];
  if (targetId && room.activePlayerId) {
    room.lastAttack = applyAttack(room, room.activePlayerId, targetId, weapon.id);
  }
  resolveReveal(io, room, true);
}

export function registerBattleSocketHandlers(io: Server, socket: Socket): void {
  socket.on('battle:hostCreateRoom', (payload: BattleHostCreateRoomPayload, ack?: (res: any) => void) => {
    try {
      if (!VALID_DIFFICULTIES.includes(payload.difficulty)) {
        ack?.({ ok: false, reason: 'Elige una dificultad válida.' });
        return;
      }
      const maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(payload.maxPlayers)));
      let packQuestions: ServerBattleRoom['packQuestions'] = null;
      let difficulty = payload.difficulty;
      if (payload.packId) {
        const pack = battlePackRepo.get(payload.packId);
        if (!pack) {
          ack?.({ ok: false, reason: 'El paquete de preguntas ya no existe.' });
          return;
        }
        packQuestions = pack.questions;
        difficulty = pack.difficulty;
      }
      const code = createBattleRoomCode();
      const hostToken = nanoid();
      const room: ServerBattleRoom = {
        code,
        hostSocketId: socket.id,
        hostToken,
        hostConnected: true,
        status: 'lobby',
        maxPlayers,
        difficulty,
        packQuestions,
        packDrawQueue: [],
        players: new Map(),
        turnOrder: [],
        eliminationOrder: [],
        activePlayerId: null,
        currentQuestion: null,
        questionEndsAt: null,
        attackTargetOptions: null,
        attackEndsAt: null,
        lastAttack: null,
        lastAnswerCorrect: null,
        revealEndsAt: null,
        questionTimeout: null,
        attackTimeout: null,
        revealTimeout: null,
        hostDisconnectTimeout: null,
      };
      saveBattleRoom(room);
      socket.join(code);
      ack?.({ ok: true, code, hostToken });
      broadcastBattleRoomState(io, room);
    } catch {
      ack?.({ ok: false, reason: 'No se pudo crear la partida.' });
    }
  });

  socket.on('battle:hostStartGame', (payload: { code: string }, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    if (!room || room.hostSocketId !== socket.id) {
      ack?.({ ok: false, reason: 'Sala no encontrada.' });
      return;
    }
    if (room.status !== 'lobby') {
      ack?.({ ok: false, reason: 'La partida ya ha comenzado.' });
      return;
    }
    if (room.players.size < MIN_PLAYERS) {
      ack?.({ ok: false, reason: `Necesitas al menos ${MIN_PLAYERS} jugadores para empezar.` });
      return;
    }
    room.turnOrder = Array.from(room.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => p.id);
    room.activePlayerId = room.turnOrder[0];
    beginQuestion(io, room);
    ack?.({ ok: true });
  });

  socket.on('battle:hostReconnect', (payload: HostReconnectPayload, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    if (!room || room.hostToken !== payload.hostToken) {
      ack?.({ ok: false, reason: 'Sesión de anfitrión no válida o partida finalizada.' });
      return;
    }
    if (room.hostDisconnectTimeout) {
      clearTimeout(room.hostDisconnectTimeout);
      room.hostDisconnectTimeout = null;
    }
    room.hostSocketId = socket.id;
    room.hostConnected = true;
    socket.join(room.code);
    ack?.({ ok: true });
    broadcastBattleRoomState(io, room);
  });

  socket.on('battle:playerReconnect', (payload: PlayerReconnectPayload, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    const player = room?.players.get(payload.playerId);
    if (!room || !player) {
      ack?.({ ok: false, reason: 'No se encontró tu sesión en esta partida.' });
      return;
    }
    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id });
    broadcastBattleRoomState(io, room);
  });

  socket.on('battle:playerJoinRoom', (payload: BattlePlayerJoinRoomPayload, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    if (!room) {
      ack?.({ ok: false, reason: 'Código de sala no válido.' });
      return;
    }
    if (room.status !== 'lobby') {
      ack?.({ ok: false, reason: 'La partida ya ha comenzado.' });
      return;
    }
    if (room.players.size >= room.maxPlayers) {
      ack?.({ ok: false, reason: 'La sala está completa.' });
      return;
    }
    const name = payload.name.trim().slice(0, 20) || 'Jugador';
    const mii = sanitizeMii(payload.mii);
    const player = createBattlePlayer(nanoid(8), socket.id, name, mii);
    room.players.set(player.id, player);
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id });

    if (room.players.size >= room.maxPlayers) {
      room.turnOrder = Array.from(room.players.values())
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((p) => p.id);
      room.activePlayerId = room.turnOrder[0];
      beginQuestion(io, room);
    } else {
      broadcastBattleRoomState(io, room);
    }
  });

  socket.on('battle:playerAnswer', (payload: BattlePlayerAnswerPayload, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    if (!room || room.status !== 'question') {
      ack?.({ ok: false, reason: 'No hay ninguna pregunta activa.' });
      return;
    }
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.activePlayerId) {
      ack?.({ ok: false, reason: 'No es tu turno.' });
      return;
    }
    if (room.questionTimeout) {
      clearTimeout(room.questionTimeout);
      room.questionTimeout = null;
    }
    const correct = room.currentQuestion != null && payload.optionIndex === room.currentQuestion.correctIndex;
    ack?.({ ok: true, correct });
    if (!correct) {
      resolveReveal(io, room, false);
      return;
    }
    const opponents = aliveOpponents(room, player.id);
    if (opponents.length === 0) {
      // No debería ocurrir con el mínimo de 2 jugadores, pero por seguridad no se cuelga la partida.
      resolveReveal(io, room, false);
      return;
    }
    room.status = 'attacking';
    room.attackTargetOptions = opponents.map((p) => p.id);
    room.attackEndsAt = Date.now() + ATTACK_CHOICE_SECONDS * 1000;
    broadcastBattleRoomState(io, room);
    room.attackTimeout = setTimeout(() => autoResolveAttack(io, room), ATTACK_CHOICE_SECONDS * 1000);
  });

  socket.on('battle:playerAttack', (payload: BattlePlayerAttackPayload, ack?: (res: any) => void) => {
    const room = getBattleRoom(payload.code);
    if (!room || room.status !== 'attacking') {
      ack?.({ ok: false, reason: 'No hay ningún ataque pendiente.' });
      return;
    }
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.activePlayerId) {
      ack?.({ ok: false, reason: 'No es tu turno.' });
      return;
    }
    if (!room.attackTargetOptions?.includes(payload.targetId)) {
      ack?.({ ok: false, reason: 'Objetivo no válido.' });
      return;
    }
    if (!BATTLE_WEAPONS.some((w) => w.id === payload.weaponId)) {
      ack?.({ ok: false, reason: 'Arma no válida.' });
      return;
    }
    if (room.attackTimeout) {
      clearTimeout(room.attackTimeout);
      room.attackTimeout = null;
    }
    room.lastAttack = applyAttack(room, player.id, payload.targetId, payload.weaponId);
    ack?.({ ok: true });
    resolveReveal(io, room, true);
  });

  socket.on('disconnect', () => {
    const playerRoom = findBattleRoomByPlayerSocket(socket.id);
    if (playerRoom) {
      const player = Array.from(playerRoom.players.values()).find((p) => p.socketId === socket.id);
      if (player) player.connected = false;
      const wasActiveTurn = !!player && player.id === playerRoom.activePlayerId;
      if (wasActiveTurn && playerRoom.status === 'question') {
        handleNoAnswer(io, playerRoom);
      } else if (wasActiveTurn && playerRoom.status === 'attacking') {
        autoResolveAttack(io, playerRoom);
      }
      if (playerRoom.hostSocketId === socket.id) {
        scheduleHostDisconnect(io, playerRoom);
      } else if (!wasActiveTurn) {
        broadcastBattleRoomState(io, playerRoom);
      }
      return;
    }
    const hostRoom = findBattleRoomByHostSocket(socket.id);
    if (hostRoom) {
      scheduleHostDisconnect(io, hostRoom);
    }
  });
}
