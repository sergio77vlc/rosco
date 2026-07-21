import { nanoid } from 'nanoid';
import type { Server, Socket } from 'socket.io';
import { DEFAULT_AVATAR } from '@rosco/shared';
import type {
  QuizDifficulty,
  QuizHostCreateRoomPayload,
  QuizPlayerAnswerPayload,
  QuizPlayerJoinRoomPayload,
} from '@rosco/shared';
import {
  createQuizRoomCode,
  deleteQuizRoom,
  findQuizRoomByHostSocket,
  findQuizRoomByPlayerSocket,
  getQuizRoom,
  saveQuizRoom,
} from './quiz/rooms.js';
import { computeQuizRanking, createQuizPlayer, resolveCurrentQuestion, toPublicQuizRoom } from './quiz/engine.js';
import { drawQuizQuestions } from './quiz/pool.js';
import type { ServerQuizPlayer, ServerQuizRoom } from './quiz/roomTypes.js';

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 12;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 20;
const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 60;
const REVEAL_SECONDS = 5;
const VALID_DIFFICULTIES: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];
const MAX_AVATAR_LENGTH = 300_000;

function broadcastQuizRoomState(io: Server, room: ServerQuizRoom): void {
  io.to(room.code).emit('quiz:roomState', toPublicQuizRoom(room));
}

function connectedPlayers(room: ServerQuizRoom): ServerQuizPlayer[] {
  return Array.from(room.players.values()).filter((p) => p.connected);
}

function finishQuizRoom(io: Server, room: ServerQuizRoom): void {
  if (room.status === 'finished') return;
  if (room.questionTimeout) clearTimeout(room.questionTimeout);
  if (room.revealTimeout) clearTimeout(room.revealTimeout);
  room.questionTimeout = null;
  room.revealTimeout = null;
  room.status = 'finished';
  broadcastQuizRoomState(io, room);
  io.to(room.code).emit('quiz:gameFinished', { ranking: computeQuizRanking(room) });
}

function beginQuestion(io: Server, room: ServerQuizRoom, index: number): void {
  room.currentQuestionIndex = index;
  room.status = 'question';
  room.questionStartedAt = Date.now();
  room.questionEndsAt = room.questionStartedAt + room.questionDurationSeconds * 1000;
  room.revealEndsAt = null;
  for (const player of room.players.values()) {
    player.currentAnswer = null;
    player.lastPointsEarned = null;
    player.lastCorrect = null;
  }
  broadcastQuizRoomState(io, room);
  room.questionTimeout = setTimeout(() => endQuestion(io, room), room.questionDurationSeconds * 1000);
}

function endQuestion(io: Server, room: ServerQuizRoom): void {
  if (room.status !== 'question') return;
  if (room.questionTimeout) {
    clearTimeout(room.questionTimeout);
    room.questionTimeout = null;
  }
  resolveCurrentQuestion(room);
  room.status = 'reveal';
  room.revealEndsAt = Date.now() + REVEAL_SECONDS * 1000;
  broadcastQuizRoomState(io, room);
  room.revealTimeout = setTimeout(() => {
    if (room.currentQuestionIndex + 1 < room.questions.length) {
      beginQuestion(io, room, room.currentQuestionIndex + 1);
    } else {
      finishQuizRoom(io, room);
    }
  }, REVEAL_SECONDS * 1000);
}

function startQuizGame(io: Server, room: ServerQuizRoom): void {
  beginQuestion(io, room, 0);
}

export function registerQuizSocketHandlers(io: Server, socket: Socket): void {
  socket.on('quiz:hostCreateRoom', (payload: QuizHostCreateRoomPayload, ack?: (res: any) => void) => {
    try {
      if (!VALID_DIFFICULTIES.includes(payload.difficulty)) {
        ack?.({ ok: false, reason: 'Elige una dificultad válida.' });
        return;
      }
      const maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(payload.maxPlayers)));
      const questionCount = Math.min(
        MAX_QUESTIONS,
        Math.max(MIN_QUESTIONS, Math.floor(payload.questionCount)),
      );
      const questionDurationSeconds = Math.min(
        MAX_DURATION_SECONDS,
        Math.max(MIN_DURATION_SECONDS, Math.floor(payload.questionDurationSeconds)),
      );
      const questions = drawQuizQuestions(payload.difficulty, questionCount);
      if (questions.length === 0) {
        ack?.({ ok: false, reason: 'No hay preguntas disponibles para esa dificultad.' });
        return;
      }
      const code = createQuizRoomCode();
      const room: ServerQuizRoom = {
        code,
        hostSocketId: socket.id,
        status: 'lobby',
        maxPlayers,
        difficulty: payload.difficulty,
        questionCount: questions.length,
        questionDurationSeconds,
        questions,
        currentQuestionIndex: -1,
        questionStartedAt: null,
        questionEndsAt: null,
        revealEndsAt: null,
        players: new Map(),
        questionTimeout: null,
        revealTimeout: null,
      };
      saveQuizRoom(room);
      socket.join(code);
      ack?.({ ok: true, code });
      broadcastQuizRoomState(io, room);
    } catch {
      ack?.({ ok: false, reason: 'No se pudo crear la partida.' });
    }
  });

  socket.on('quiz:hostStartGame', (payload: { code: string }, ack?: (res: any) => void) => {
    const room = getQuizRoom(payload.code);
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
    startQuizGame(io, room);
    ack?.({ ok: true });
  });

  socket.on('quiz:playerJoinRoom', (payload: QuizPlayerJoinRoomPayload, ack?: (res: any) => void) => {
    const room = getQuizRoom(payload.code);
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
    const player = createQuizPlayer(nanoid(8), socket.id, name, payload.color, avatar);
    room.players.set(player.id, player);
    socket.join(room.code);
    ack?.({ ok: true, playerId: player.id, room: toPublicQuizRoom(room) });
    broadcastQuizRoomState(io, room);
  });

  socket.on('quiz:playerAnswer', (payload: QuizPlayerAnswerPayload, ack?: (res: any) => void) => {
    const room = getQuizRoom(payload.code);
    if (!room || room.status !== 'question') {
      ack?.({ ok: false, reason: 'No hay ninguna pregunta activa.' });
      return;
    }
    const player = Array.from(room.players.values()).find((p) => p.socketId === socket.id);
    if (!player) {
      ack?.({ ok: false, reason: 'Jugador no encontrado.' });
      return;
    }
    if (player.currentAnswer) {
      ack?.({ ok: false, reason: 'Ya has respondido.' });
      return;
    }
    if (![0, 1, 2, 3].includes(payload.optionIndex)) {
      ack?.({ ok: false, reason: 'Opción no válida.' });
      return;
    }
    player.currentAnswer = { optionIndex: payload.optionIndex, answeredAt: Date.now() };
    ack?.({ ok: true });
    broadcastQuizRoomState(io, room);
    const connected = connectedPlayers(room);
    if (connected.length > 0 && connected.every((p) => p.currentAnswer !== null)) {
      endQuestion(io, room);
    }
  });

  socket.on('disconnect', () => {
    const playerRoom = findQuizRoomByPlayerSocket(socket.id);
    if (playerRoom) {
      const player = Array.from(playerRoom.players.values()).find((p) => p.socketId === socket.id);
      if (player) player.connected = false;
      if (playerRoom.hostSocketId === socket.id) {
        io.to(playerRoom.code).emit('quiz:roomError', { reason: 'El anfitrión ha cerrado la partida.' });
        deleteQuizRoom(playerRoom.code);
        return;
      }
      broadcastQuizRoomState(io, playerRoom);
      if (playerRoom.status === 'question') {
        const connected = connectedPlayers(playerRoom);
        if (connected.length > 0 && connected.every((p) => p.currentAnswer !== null)) {
          endQuestion(io, playerRoom);
        }
      }
      return;
    }
    const hostRoom = findQuizRoomByHostSocket(socket.id);
    if (hostRoom) {
      io.to(hostRoom.code).emit('quiz:roomError', { reason: 'El anfitrión ha cerrado la partida.' });
      deleteQuizRoom(hostRoom.code);
    }
  });
}
