import type { CrosswordPuzzle, CrosswordSummary } from '@rosco/shared';
import { CROSSWORD_PRESETS } from './presets.js';
import { validatePuzzle } from './grid.js';

// Se valida cada crucigrama preestablecido al arrancar el servidor: si algún cruce de
// letras estuviera mal escrito, el fallo aparece aquí en vez de en mitad de una partida real.
for (const puzzle of CROSSWORD_PRESETS) {
  validatePuzzle(puzzle);
}

export function listCrosswordSummaries(): CrosswordSummary[] {
  return CROSSWORD_PRESETS.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    wordCount: p.clues.length,
  }));
}

export function getCrosswordPuzzle(id: string): CrosswordPuzzle | undefined {
  return CROSSWORD_PRESETS.find((p) => p.id === id);
}
