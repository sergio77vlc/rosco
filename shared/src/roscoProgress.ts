import type { LetterState } from './types.js';

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
