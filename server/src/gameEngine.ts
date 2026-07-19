import { createInitialProgress, isAnswerCorrect, resolveCurrentLetter } from '@rosco/shared';
import type { LetterState, PlayerPublic, RankingEntry, RoomPublic } from '@rosco/shared';
import type { ServerPlayer, ServerRoom } from './roomTypes.js';

export function createPlayer(
  id: string,
  socketId: string,
  name: string,
  color: string,
  avatar: string,
  roscoLength: number,
): ServerPlayer {
  return {
    id,
    socketId,
    name,
    color,
    avatar,
    connected: true,
    progress: createInitialProgress(roscoLength),
    currentIndex: 0,
    finishedAt: null,
    joinedAt: Date.now(),
  };
}

function applyResolution(player: ServerPlayer, resolution: 'correct' | 'wrong' | 'passed'): void {
  const result = resolveCurrentLetter(player.progress, player.currentIndex, resolution);
  player.progress = result.progress;
  player.currentIndex = result.currentIndex;
  if (result.finished && !player.finishedAt) player.finishedAt = Date.now();
}

export function submitAnswer(room: ServerRoom, player: ServerPlayer, answerText: string): void {
  if (player.finishedAt) return;
  const clue = room.rosco.letters[player.currentIndex];
  const correct = isAnswerCorrect(answerText, clue.answer);
  applyResolution(player, correct ? 'correct' : 'wrong');
}

export function passLetter(room: ServerRoom, player: ServerPlayer): void {
  if (player.finishedAt) return;
  applyResolution(player, 'passed');
}

export function reconnectPlayer(player: ServerPlayer, socketId: string): void {
  player.socketId = socketId;
  player.connected = true;
}

function toPublicPlayer(player: ServerPlayer): PlayerPublic {
  const progress = player.progress.map((state, idx): { state: LetterState } => {
    if (!player.finishedAt && idx === player.currentIndex && (state === 'pending' || state === 'passed')) {
      return { state: 'active' };
    }
    return { state };
  });
  const correctCount = player.progress.filter((s) => s === 'correct').length;
  const wrongCount = player.progress.filter((s) => s === 'wrong').length;
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    avatar: player.avatar,
    connected: player.connected,
    progress,
    currentIndex: player.currentIndex,
    correctCount,
    wrongCount,
    finishedAt: player.finishedAt,
  };
}

export function toPublicRoom(room: ServerRoom): RoomPublic {
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    rosco: {
      id: room.rosco.id,
      title: room.rosco.title,
      difficulty: room.rosco.difficulty,
      theme: room.rosco.theme,
      source: room.rosco.source,
      letters: room.rosco.letters.map((l) => ({ letter: l.letter, clue: l.clue, matchType: l.matchType })),
    },
    timerSeconds: room.timerSeconds,
    startedAt: room.startedAt,
    endsAt: room.endsAt,
    players: Array.from(room.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(toPublicPlayer),
  };
}

export function allPlayersFinished(room: ServerRoom): boolean {
  if (room.players.size === 0) return false;
  return Array.from(room.players.values()).every((p) => p.finishedAt !== null);
}

export function computeRanking(room: ServerRoom): RankingEntry[] {
  const entries = Array.from(room.players.values()).map((p) => {
    const correctCount = p.progress.filter((s) => s === 'correct').length;
    const wrongCount = p.progress.filter((s) => s === 'wrong').length;
    return { player: p, correctCount, wrongCount };
  });
  entries.sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (a.wrongCount !== b.wrongCount) return a.wrongCount - b.wrongCount;
    const aFinished = a.player.finishedAt ?? Infinity;
    const bFinished = b.player.finishedAt ?? Infinity;
    return aFinished - bFinished;
  });
  return entries.map((e, i) => ({
    playerId: e.player.id,
    name: e.player.name,
    color: e.player.color,
    avatar: e.player.avatar,
    correctCount: e.correctCount,
    wrongCount: e.wrongCount,
    finishedAt: e.player.finishedAt,
    rank: i + 1,
  }));
}
