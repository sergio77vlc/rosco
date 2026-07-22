import { isAnswerCorrect } from '@rosco/shared';
import type { CrosswordPlayerPublic, CrosswordRankingEntry, CrosswordRoomPublic } from '@rosco/shared';
import { toPublicClues, toPublicGrid } from './grid.js';
import type { ServerCrosswordPlayer, ServerCrosswordRoom } from './roomTypes.js';

export function createCrosswordPlayer(
  id: string,
  socketId: string,
  name: string,
  color: string,
  avatar: string,
): ServerCrosswordPlayer {
  return {
    id,
    socketId,
    name,
    color,
    avatar,
    connected: true,
    score: 0,
    wordsSolved: 0,
    focusedClueId: null,
    joinedAt: Date.now(),
  };
}

/** Puntos por palabra: proporcionales a su longitud, para premiar más las palabras largas. */
export function pointsForLength(length: number): number {
  return length * 10;
}

export function isPuzzleComplete(room: ServerCrosswordRoom): boolean {
  return room.solvedClueIds.size >= room.puzzle.clues.length;
}

export interface SubmitResult {
  ok: boolean;
  reason?: string;
  correct?: boolean;
  points?: number;
}

/** Todos los jugadores pueden intentar cualquier palabra en cualquier momento: no hay turnos. */
export function submitAnswer(room: ServerCrosswordRoom, player: ServerCrosswordPlayer, clueId: string, answerText: string): SubmitResult {
  const clue = room.puzzle.clues.find((c) => c.id === clueId);
  if (!clue) return { ok: false, reason: 'Pista no encontrada.' };
  if (room.solvedClueIds.has(clueId)) return { ok: false, reason: 'Esa palabra ya está resuelta.' };

  const correct = isAnswerCorrect(answerText, clue.answer);
  if (!correct) return { ok: true, correct: false };

  const points = pointsForLength(clue.length);
  room.solvedClueIds.add(clueId);
  room.solvedByName.set(clueId, player.name);
  player.score += points;
  player.wordsSolved += 1;
  room.lastSolved = { clueId, playerName: player.name, word: clue.answer, points, at: Date.now() };

  return { ok: true, correct: true, points };
}

export function computeCrosswordRanking(room: ServerCrosswordRoom): CrosswordRankingEntry[] {
  const sorted = Array.from(room.players.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wordsSolved - a.wordsSolved;
  });
  return sorted.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    color: p.color,
    avatar: p.avatar,
    score: p.score,
    wordsSolved: p.wordsSolved,
    place: i + 1,
  }));
}

function toPublicPlayer(player: ServerCrosswordPlayer): CrosswordPlayerPublic {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    avatar: player.avatar,
    connected: player.connected,
    score: player.score,
    wordsSolved: player.wordsSolved,
    focusedClueId: player.focusedClueId,
  };
}

export function toPublicCrosswordRoom(room: ServerCrosswordRoom): CrosswordRoomPublic {
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    puzzleTitle: room.puzzle.title,
    difficulty: room.puzzle.difficulty,
    rows: room.puzzle.rows,
    cols: room.puzzle.cols,
    grid: toPublicGrid(room.puzzle, room.solvedClueIds),
    clues: toPublicClues(room.puzzle, room.solvedClueIds, room.solvedByName),
    players: Array.from(room.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(toPublicPlayer),
    hostConnected: room.hostConnected,
    lastSolved: room.lastSolved,
  };
}
