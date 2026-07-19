import { createInitialProgress, isAnswerCorrect, resolveCurrentLetter } from '@rosco/shared';
import type { LetterState, PlayerPublic, RankingEntry, Rosco, RoomPublic } from '@rosco/shared';
import type { ServerPlayer, ServerRoom } from './roomTypes.js';

export function createPlayer(
  id: string,
  socketId: string,
  name: string,
  color: string,
  avatar: string,
  rosco: Rosco,
): ServerPlayer {
  return {
    id,
    socketId,
    name,
    color,
    avatar,
    connected: true,
    rosco,
    progress: createInitialProgress(rosco.letters.length),
    currentIndex: 0,
    finishedAt: null,
    joinedAt: Date.now(),
  };
}

export interface ResolutionOutcome {
  finished: boolean;
}

export function submitAnswer(player: ServerPlayer, answerText: string): ResolutionOutcome & { correct: boolean } {
  if (player.finishedAt) return { correct: false, finished: true };
  const clue = player.rosco.letters[player.currentIndex];
  const correct = isAnswerCorrect(answerText, clue.answer);
  const result = resolveCurrentLetter(player.progress, player.currentIndex, correct ? 'correct' : 'wrong');
  player.progress = result.progress;
  player.currentIndex = result.currentIndex;
  if (result.finished && !player.finishedAt) player.finishedAt = Date.now();
  return { correct, finished: result.finished };
}

export function passLetter(player: ServerPlayer): ResolutionOutcome {
  if (player.finishedAt) return { finished: true };
  const result = resolveCurrentLetter(player.progress, player.currentIndex, 'passed');
  player.progress = result.progress;
  player.currentIndex = result.currentIndex;
  if (result.finished && !player.finishedAt) player.finishedAt = Date.now();
  return { finished: result.finished };
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
    rosco: {
      id: player.rosco.id,
      title: player.rosco.title,
      difficulty: player.rosco.difficulty,
      theme: player.rosco.theme,
      source: player.rosco.source,
      letters: player.rosco.letters.map((l) => ({ letter: l.letter, clue: l.clue, matchType: l.matchType })),
    },
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
    roscoTheme: room.roscoTheme,
    roscoDifficulty: room.roscoDifficulty,
    timerSeconds: room.timerSeconds,
    startedAt: room.startedAt,
    endsAt: room.endsAt,
    activePlayerId: room.activePlayerId,
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
