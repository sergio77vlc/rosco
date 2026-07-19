import type { LetterState, TurnAwarePlayer } from './types.js';

export function createInitialProgress(length: number): LetterState[] {
  return Array.from({ length }, () => 'pending' as LetterState);
}

/** Índice de la siguiente letra pendiente o pasada, dando la vuelta al rosco. Null si no queda ninguna. */
export function findNextOpenIndex(progress: LetterState[], currentIndex: number): number | null {
  const len = progress.length;
  for (let step = 1; step <= len; step++) {
    const idx = (currentIndex + step) % len;
    const state = progress[idx];
    if (state === 'pending' || state === 'passed') return idx;
  }
  return null;
}

export interface ResolveResult {
  progress: LetterState[];
  currentIndex: number;
  finished: boolean;
}

/** Resuelve la letra actual (correct/wrong/passed) y avanza a la siguiente letra abierta. */
export function resolveCurrentLetter(
  progress: LetterState[],
  currentIndex: number,
  resolution: 'correct' | 'wrong' | 'passed',
): ResolveResult {
  const next = [...progress];
  next[currentIndex] = resolution;
  const nextIndex = findNextOpenIndex(next, currentIndex);
  if (nextIndex === null) {
    return { progress: next, currentIndex, finished: true };
  }
  return { progress: next, currentIndex: nextIndex, finished: false };
}

/**
 * Siguiente jugador (dando la vuelta a la lista) que todavía no ha terminado su rosco,
 * empezando a buscar justo después de `currentId`. Si `currentId` es null, empieza por
 * el primero de la lista. Devuelve null si no queda ningún jugador activo.
 */
export function nextActivePlayerId<T extends TurnAwarePlayer>(
  players: T[],
  currentId: string | null,
): string | null {
  const n = players.length;
  if (n === 0) return null;
  const startIndex = currentId ? players.findIndex((p) => p.id === currentId) : -1;
  for (let step = 1; step <= n; step++) {
    const idx = (startIndex + step + n) % n;
    if (!players[idx].finishedAt) return players[idx].id;
  }
  return null;
}
