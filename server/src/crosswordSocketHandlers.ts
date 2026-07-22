import { nanoid } from 'nanoid';
import type { Server, Socket } from 'socket.io';
import { DEFAULT_AVATAR } from '@rosco/shared';
import type {
  CrosswordHostCreateRoomPayload,
  CrosswordPlayerFocusPayload,
  CrosswordPlayerJoinRoomPayload,
  CrosswordPlayerSubmitPayload,
  HostReconnectPayload,
  PlayerReconnectPayload,
} from '@rosco/shared';
import {
  createCrosswordRoomCode,
  deleteCrosswordRoom,
  findCrosswordRoomByHostSocket,
  findCrosswordRoomByPlayerSocket,
  getCrosswordRoom,
  saveCrosswordRoom,
} from './crossword/rooms.js';
import {
  computeCrosswordRanking,
  createCrosswordPlayer,
  isPuzzleComplete,
  submitAnswer,
  toPublicCrosswordRoom,
} from './crossword/engine.js';
import { getCrosswordPuzzle } from './crossword/pool.js';
import type { ServerCrosswordRoom } from './crossword/roomTypes.js';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MAX_AVATAR_LENGTH = 300_000;
// Tiempo que se mantiene viva la sala tras desconectarse el anfitrión, por si vuelve
// (recarga de página, corte de red breve) antes de darla por cerrada.
const HOST_RECONNECT_GRACE_MS = 45_000;

function broadcastCrosswordRoomState(io: Server, room: ServerCrosswordRoom): void {
  io.to(room.code).emit('crossword:roomState', toPublicCrosswordRoom(room));
}

function scheduleHostDisconnect(io: Server, room: ServerCrosswordRoom): void {
  room.hostConnected = false;
  broadcastCrosswordRoomState(io, room);
  if (room.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  room.hostDisconnectTimeout = setTimeout(() => {
    io.to(room.code).emit('crossword:roomError', { reason: 'El anfitrión no volvió a tiempo. La partida ha finalizado.' });
    deleteCrosswordRoom(room.code);
  }, HOST_RECONNECT_GRACE_MS);
}

function finishIfComplete(io: Server, room: ServerCrosswordRoom): void {
  if (!isPuzzleComplete(room)) return;
  room.status = 'finished';
  broadcastCrosswordRoomState(io, room);
  io.to(room.code).emit('crossword:gameFinished', { ranking: computeCrosswordRanking(room) });
}

export function registerCrosswordSocketHandlers(io: Server, socket: Socket): void {
  socket.on('crossword:hostCreateRoom', (payload: CrosswordHostCreateRoomPayload, ack?: (res: any) => void) => {
    try {
      const puzzle = getCrosswordPuzzle(payload.puzzleId);
      if (!puzzle) {
        ack?.({ ok: false, reason: 'Crucigrama no encontrado.' });
        return;
      }
      const maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(payload.maxPlayers)));
      const code = createCrosswordRoomCode();
      const hostToken = nanoid();
      const room: ServerCrosswordRoom = {
        code,
        hostSocketId: socket.id,
        hostToken,
        hostConnected: true,
        status: 'lobby',
        maxPlayers,
        puzzle,
        solvedClueIds: new Set(),
        solvedByName: new Map(),
        lastSolved: null,
        players: new Map(),
        hostDisconnectTimeout: null,
      };
      saveCrosswordRoom(room);
      socket.join(code);
      ack?.({ ok: true, code, hostToken });
      broadcastCrosswordRoomState(io, room);
    } catch {
      ack?.({ ok: false, reason: 'No se pudo crear la partida.' });
    }
  });

  socket.on('crossword:hostStartGame', (payload: { code: string }, ack?: (res: any) => void) => {
    const room = getCrosswordRoom(payload.code);
    if (!room || room.hostSocketId !== socket.id) {
      ack?.({ ok: false, reason: 'Sala no encontrada.' });
      return;
    }
    if (room.status !== 'lobby') {
      ack?.({ ok: false, reason: 'La partida ya ha comenzado.' });
      return;
    }
    if (room.players.size < 1) {
      ack?.({ ok: false, reason: 'Necesitas al menos un jugador para empezar.' });
      return;
    }
    room.status = 'playing';
    broadcastCrosswordRoomState(io, room);
    ack?.({ ok: true });
  });

  socket.on('crossword:hostReconnect', (payload: HostReconnectPayload, ack?: (res: any) => void) => {
    const room = getCrosswordRoom(payload.code);
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
    broadcastCrosswordRoomState(io, room);
  });

  socket.on('crossword:playerReconnect', (payload: PlayerReconnectPayload, ack?: (res: any) => void) => {
    const room = getCrosswordRoom(payload.code);
    const player = room?.players.get(payload.playerId);
    if (!room || !player) {
      ack?.({ ok: false, reason: 'No se encontró tu sesión en esta partida.' });
      return;
    }
    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id });
    broadcastCrosswordRoomState(io, room);
  });

  socket.on('crossword:playerJoinRoom', (payload: CrosswordPlayerJoinRoomPayload, ack?: (res: any) => void) => {
    const room = getCrosswordRoom(payload.code);
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
    const avatar = typeof payload.avatar === 'string' && payload.avatar.length <= MAX_AVATAR_LENGTH
      ? payload.avatar
      : DEFAULT_AVATAR;
    const player = createCrosswordPlayer(nanoid(8), socket.id, name, payload.color, avatar);
    room.players.set(player.id, player);
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id });

    if (room.players.size >= room.maxPlayers) {
      room.status = 'playing';
    }
    broadcastCrosswordRoomState(io, room);
  });

  socket.on('crossword:playerFocus', (payload: CrosswordPlayerFocusPayload) => {
    const room = getCrosswordRoom(payload.code);
    if (!room || room.status !== 'playing') return;
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player) return;
    player.focusedClueId = payload.clueId;
    broadcastCrosswordRoomState(io, room);
  });

  socket.on('crossword:playerSubmitAnswer', (payload: CrosswordPlayerSubmitPayload, ack?: (res: any) => void) => {
    const room = getCrosswordRoom(payload.code);
    if (!room || room.status !== 'playing') {
      ack?.({ ok: false, reason: 'No hay ninguna partida en curso.' });
      return;
    }
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player) {
      ack?.({ ok: false, reason: 'Jugador no encontrado.' });
      return;
    }
    const result = submitAnswer(room, player, payload.clueId, payload.answerText);
    ack?.(result);
    if (result.ok && result.correct) {
      broadcastCrosswordRoomState(io, room);
      finishIfComplete(io, room);
    }
  });

  socket.on('disconnect', () => {
    const playerRoom = findCrosswordRoomByPlayerSocket(socket.id);
    if (playerRoom) {
      const player = Array.from(playerRoom.players.values()).find((p) => p.socketId === socket.id);
      if (player) player.connected = false;
      if (playerRoom.hostSocketId === socket.id) {
        scheduleHostDisconnect(io, playerRoom);
      } else {
        broadcastCrosswordRoomState(io, playerRoom);
      }
      return;
    }
    const hostRoom = findCrosswordRoomByHostSocket(socket.id);
    if (hostRoom) {
      scheduleHostDisconnect(io, hostRoom);
    }
  });
}
