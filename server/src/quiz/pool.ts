import type { QuizDifficulty, QuizQuestion } from '@rosco/shared';
import { buildQuizBank } from './bank.js';
import { CULTURA_GENERAL_MEDIO_QUIZ } from './data/culturaGeneralMedio.js';
import { CULTURA_GENERAL_DIFICIL_QUIZ } from './data/culturaGeneralDificil.js';

const MEDIO_BANK = buildQuizBank('cultura-general-medio', CULTURA_GENERAL_MEDIO_QUIZ);
const DIFICIL_BANK = buildQuizBank('cultura-general-dificil', CULTURA_GENERAL_DIFICIL_QUIZ);

/**
 * Cola de índices barajados por banco: cada draw() consume el siguiente índice sin repetir
 * hasta agotar el banco, momento en el que se vuelve a barajar. Vive en memoria del proceso,
 * así que las partidas sucesivas van avanzando por la pila entera antes de repetir pregunta.
 */
const drawQueues = new Map<string, number[]>();

function shuffledIndices(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawIndex(key: string, poolSize: number): number {
  let queue = drawQueues.get(key);
  if (!queue || queue.length === 0) {
    queue = shuffledIndices(poolSize);
    drawQueues.set(key, queue);
  }
  return queue.pop()!;
}

/** Extrae `count` preguntas distintas (sin repetir dentro de la misma partida) de la dificultad indicada. */
export function drawQuizQuestions(difficulty: QuizDifficulty, count: number): QuizQuestion[] {
  const pools: QuizQuestion[][] =
    difficulty === 'mixto' ? [MEDIO_BANK, DIFICIL_BANK] : difficulty === 'medio' ? [MEDIO_BANK] : [DIFICIL_BANK];
  const bank = pools.flat();
  const key = difficulty;
  const used = new Set<number>();
  const result: QuizQuestion[] = [];
  const n = Math.min(count, bank.length);
  for (let i = 0; i < n; i++) {
    let idx = drawIndex(key, bank.length);
    let guard = 0;
    while (used.has(idx) && guard < bank.length) {
      idx = drawIndex(key, bank.length);
      guard++;
    }
    used.add(idx);
    result.push(bank[idx]);
  }
  return result;
}
