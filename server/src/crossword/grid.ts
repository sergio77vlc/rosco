import type { CrosswordClueDef, CrosswordCellView, CrosswordClueView, CrosswordPuzzle } from '@rosco/shared';

interface CellMeta {
  blocked: boolean;
  number: number | null;
  answerLetter: string | null;
}

const metaCache = new Map<string, CellMeta[][]>();

/** Construye la rejilla completa (bloqueada/número/letra esperada) a partir de las palabras
 * del crucigrama. Lanza un error si dos palabras que se cruzan no coinciden en la letra
 * compartida — así un error de transcripción se detecta al cargar el crucigrama, no en
 * mitad de una partida real. */
function buildGridMeta(puzzle: CrosswordPuzzle): CellMeta[][] {
  const grid: CellMeta[][] = Array.from({ length: puzzle.rows }, () =>
    Array.from({ length: puzzle.cols }, () => ({ blocked: true, number: null, answerLetter: null })),
  );
  for (const clue of puzzle.clues) {
    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === 'down' ? clue.row + i : clue.row;
      const col = clue.direction === 'across' ? clue.col + i : clue.col;
      if (row < 0 || row >= puzzle.rows || col < 0 || col >= puzzle.cols) {
        throw new Error(`Crucigrama "${puzzle.id}": la pista "${clue.id}" se sale de la rejilla.`);
      }
      const letter = clue.answer.toUpperCase().charAt(i);
      const cell = grid[row][col];
      if (cell.answerLetter && cell.answerLetter !== letter) {
        throw new Error(
          `Crucigrama "${puzzle.id}": letras incompatibles en (${row},${col}) por la pista "${clue.id}".`,
        );
      }
      cell.blocked = false;
      cell.answerLetter = letter;
      if (i === 0 && cell.number == null) cell.number = clue.number;
    }
  }
  return grid;
}

function getGridMeta(puzzle: CrosswordPuzzle): CellMeta[][] {
  let meta = metaCache.get(puzzle.id);
  if (!meta) {
    meta = buildGridMeta(puzzle);
    metaCache.set(puzzle.id, meta);
  }
  return meta;
}

/** Coordenadas de cada celda que ocupa una pista, en orden. */
export function cellsForClue(clue: CrosswordClueDef): { row: number; col: number }[] {
  return Array.from({ length: clue.length }, (_, i) => ({
    row: clue.direction === 'down' ? clue.row + i : clue.row,
    col: clue.direction === 'across' ? clue.col + i : clue.col,
  }));
}

/** Se llama una vez al arrancar el servidor para cada crucigrama preestablecido: si hay una
 * letra mal escrita en algún cruce, falla pronto en vez de dejar una partida irresoluble. */
export function validatePuzzle(puzzle: CrosswordPuzzle): void {
  buildGridMeta(puzzle);
}

export function toPublicGrid(puzzle: CrosswordPuzzle, solvedClueIds: ReadonlySet<string>): CrosswordCellView[][] {
  const meta = getGridMeta(puzzle);
  const view: CrosswordCellView[][] = meta.map((row) =>
    row.map((cell) => ({ blocked: cell.blocked, number: cell.number, letter: null })),
  );
  for (const clue of puzzle.clues) {
    if (!solvedClueIds.has(clue.id)) continue;
    for (const { row, col } of cellsForClue(clue)) {
      view[row][col].letter = meta[row][col].answerLetter;
    }
  }
  return view;
}

export function toPublicClues(
  puzzle: CrosswordPuzzle,
  solvedClueIds: ReadonlySet<string>,
  solvedByName: ReadonlyMap<string, string>,
): CrosswordClueView[] {
  return puzzle.clues.map((c) => ({
    id: c.id,
    number: c.number,
    direction: c.direction,
    row: c.row,
    col: c.col,
    length: c.length,
    clue: c.clue,
    solved: solvedClueIds.has(c.id),
    solvedBy: solvedByName.get(c.id) ?? null,
  }));
}
