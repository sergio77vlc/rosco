import { nanoid } from 'nanoid';
import { ROSCO_ALPHABET, defaultMatchTypeForLetter, type Difficulty, type Rosco } from '@rosco/shared';
import type { QuestionBank } from './bank.js';
import { CULTURA_GENERAL_MEDIO_BANK } from './data/culturaGeneralMedio.js';
import { CULTURA_GENERAL_DIFICIL_BANK } from './data/culturaGeneralDificil.js';

export const ROSCO_THEME = 'cultura general';

const BANKS: Record<Difficulty, QuestionBank> = {
  medio: CULTURA_GENERAL_MEDIO_BANK,
  dificil: CULTURA_GENERAL_DIFICIL_BANK,
};

/**
 * Cola de índices barajados por letra+dificultad: cada draw() consume el siguiente índice
 * sin repetir hasta agotar el banco de esa letra, momento en el que se vuelve a barajar.
 * Vive en memoria del proceso, así que las partidas sucesivas (mientras el servidor no se
 * reinicie) van avanzando por la pila entera antes de repetir ninguna pregunta.
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

/**
 * Extrae `count` roscos distintos de la dificultad indicada: para cada letra, cada rosco
 * recibe una pregunta diferente (sin repetir dentro de la misma partida), extraída de la
 * pila viva de esa letra (sin repetir apenas en partidas sucesivas, hasta agotar la pila).
 */
export function drawRoscos(difficulty: Difficulty, count: number): Rosco[] {
  const bank = BANKS[difficulty];
  const roscos: Rosco[] = Array.from({ length: count }, () => ({
    id: `draw-${nanoid(8)}`,
    title: `Cultura general (${difficulty})`,
    difficulty,
    theme: ROSCO_THEME,
    letters: [],
    source: 'preset',
  }));

  for (const letter of ROSCO_ALPHABET) {
    const entries = bank[letter];
    const matchType = defaultMatchTypeForLetter(letter);
    const usedThisDraw = new Set<number>();
    for (let i = 0; i < count; i++) {
      const key = `${difficulty}:${letter}`;
      let idx = drawIndex(key, entries.length);
      let guard = 0;
      while (usedThisDraw.has(idx) && guard < entries.length) {
        idx = drawIndex(key, entries.length);
        guard++;
      }
      usedThisDraw.add(idx);
      const [clue, answer] = entries[idx];
      roscos[i].letters.push({ letter, clue, answer, matchType });
    }
  }

  return roscos;
}
