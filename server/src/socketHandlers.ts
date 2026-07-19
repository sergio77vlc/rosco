import { nanoid } from 'nanoid';
import type { Server, Socket } from 'socket.io';
import { ROSCO_ALPHABET, answerMatchesLetterRule } from '@rosco/shared';
import type {
  HostCreateRoomPayload,
  PlayerJoinRoomPayload,
  PlayerPassPayload,
  PlayerSubmitAnswerPayload,
  Rosco,
} from '@rosco/shared';
import {
  createRoomCode,
  deleteRoom,
  findRoomByHostSocket,
  findRoomByPlayerSocket,
  getRoom,
  saveRoom,
} from './rooms.js';
import {
  allPlayersFinished,
  computeRanking,
  createPlayer,
  passLetter,
  submitAnswer,
  toPublicRoom,
} from './gameEngine.js';
import type { ServerRoom } from './roomTypes.js';

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 6;
const MIN_TIMER_SECONDS = 30;
const MAX_TIMER_SECONDS = 600;

function validateRosco(rosco: Rosco): string | null {
  if (!rosco || !Array.isArray(rosco.letters) || rosco.letters.length !== ROSCO_ALPHABET.length) {
    return 'El rosco debe tener 25 letras.';
  }
  for (let i = 0; i < ROSCO_ALPHABET.length; i++) {
    const entry = rosco.letters[i];
    if (!entry || entry.letter !== ROSCO_ALPHABET[i]) {
      return `Letra inesperada en la posición ${i + 1}.`;
    }
    if (!entry.clue?.trim() || !entry.answer?.trim()) {
      return `Falta la pista o la respuesta de la letra ${entry.letter}.`;
    }
    if (!answerMatchesLetterRule(entry.answer, entry.letter, entry.matchType)) {
      return `La respuesta de la letra ${entry.letter} no cumple la regla (${entry.matchType}).`;
    }
  }
  return null;
}

function broadcastRoomState(io: Server, room: ServerRoom): void {
  io.to(room.code).emit('room:state', toPublicRoom(room));
}

function finishRoom(io: Server, room: ServerRoom): void {
  if (room.status === 'finished') return;
  room.status = 'finished';
  if (room.finishTimeout) {
    clearTimeout(room.finishTimeout);
    room.finishTimeout = null;
  }
  broadcastRoomState(io, room);
  io.to(room.code).emit('game:finished', { ranking: computeRanking(room) });
}

function maybeAutoFinish(io: Server, room: ServerRoom): void {
  if (room.status === 'playing' && allPlayersFinished(room)) {
    finishRoom(io, room);
  }
}

function startGame(io: Server, room: ServerRoom): void {
  room.status = 'playing';
  room.startedAt = Date.now();
  room.endsAt = room.startedAt + room.timerSeconds * 1000;
  room.finishTimeout = setTimeout(() => finishRoom(io, room), room.timerSeconds * 1000);
  broadcastRoomState(io, room);
  io.to(room.code).emit('game:started', { startedAt: room.startedAt, endsAt: room.endsAt });
}

export function registerSocketHandlers(io: Server, socket: Socket): void {
  socket.on('host:createRoom', (payload: HostCreateRoomPayload, ack?: (res: any) => void) => {
    try {
      const maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(payload.maxPlayers)));
      const timerSeconds = Math.min(
        MAX_TIMER_SECONDS,
        Math.max(MIN_TIMER_SECONDS, Math.floor(payload.timerSeconds)),
      );
      const roscoError = validateRosco(payload.rosco);
      if (roscoError) {
        ack?.({ ok: false, reason: roscoError });
        return;
      }
      const code = createRoomCode();
      const room: ServerRoom = {
        code,
        hostSocketId: socket.id,
        status: 'lobby',
        maxPlayers,
        rosco: payload.rosco,
        timerSeconds,
        startedAt: null,
        endsAt: null,
        players: new Map(),
        finishTimeout: null,
      };
      saveRoom(room);
      socket.join(code);
      ack?.({ ok: true, code });
      broadcastRoomState(io, room);
    } catch {
      ack?.({ ok: false, reason: 'No se pudo crear la partida.' });
    }
  });

  socket.on('host:startGame', (payload: { code: string }, ack?: (res: any) => void) => {
    const room = getRoom(payload.code);
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
    startGame(io, room);
    ack?.({ ok: true });
  });

  socket.on('player:joinRoom', (payload: PlayerJoinRoomPayload, ack?: (res: any) => void) => {
    const room = getRoom(payload.code);
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
    const player = createPlayer(nanoid(8), socket.id, name, payload.color, room.rosco.letters.length);
    room.players.set(player.id, player);
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id, room: toPublicRoom(room) });

    if (room.players.size >= room.maxPlayers) {
      // La sala se ha llenado (incluye el caso de partidas de 1 jugador): empieza sin esperar al anfitrión.
      startGame(io, room);
    } else {
      broadcastRoomState(io, room);
    }
  });

  socket.on('player:submitAnswer', (payload: PlayerSubmitAnswerPayload) => {
    const room = getRoom(payload.code);
    if (!room || room.status !== 'playing') return;
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player) return;
    submitAnswer(room, player, payload.answerText);
    broadcastRoomState(io, room);
    maybeAutoFinish(io, room);
  });

  socket.on('player:pass', (payload: PlayerPassPayload) => {
    const room = getRoom(payload.code);
    if (!room || room.status !== 'playing') return;
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player) return;
    passLetter(room, player);
    broadcastRoomState(io, room);
    maybeAutoFinish(io, room);
  });

  socket.on('disconnect', () => {
    const playerRoom = findRoomByPlayerSocket(socket.id);
    if (playerRoom) {
      const player = Array.from(playerRoom.players.values()).find((p) => p.socketId === socket.id);
      if (player) player.connected = false;
      if (playerRoom.hostSocketId === socket.id) {
        // Partida en solitario: el mismo dispositivo es anfitrión y jugador. Al salir, se cierra la sala.
        io.to(playerRoom.code).emit('room:error', { reason: 'El anfitrión ha cerrado la partida.' });
        deleteRoom(playerRoom.code);
        return;
      }
      broadcastRoomState(io, playerRoom);
      return;
    }
    const hostRoom = findRoomByHostSocket(socket.id);
    if (hostRoom) {
      io.to(hostRoom.code).emit('room:error', { reason: 'El anfitrión ha cerrado la partida.' });
      deleteRoom(hostRoom.code);
    }
  });
}
