import type { CrosswordCellView, CrosswordClueView, CrosswordDirection, CrosswordPuzzle } from '@rosco/shared';

interface CellMeta {
  blocked: boolean;
  number: number | null;
  answerLetter: string | null;
}

function buildMeta(puzzle: CrosswordPuzzle): CellMeta[][] {
  const grid: CellMeta[][] = Array.from({ length: puzzle.rows }, () =>
    Array.from({ length: puzzle.cols }, () => ({ blocked: true, number: null, answerLetter: null })),
  );
  for (const clue of puzzle.clues) {
    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === 'down' ? clue.row + i : clue.row;
      const col = clue.direction === 'across' ? clue.col + i : clue.col;
      const letter = clue.answer.toUpperCase().charAt(i);
      const cell = grid[row][col];
      cell.blocked = false;
      cell.answerLetter = letter;
      if (i === 0 && cell.number == null) cell.number = clue.number;
    }
  }
  return grid;
}

export function cellsForClue(clue: { row: number; col: number; length: number; direction: CrosswordDirection }) {
  return Array.from({ length: clue.length }, (_, i) => ({
    row: clue.direction === 'down' ? clue.row + i : clue.row,
    col: clue.direction === 'across' ? clue.col + i : clue.col,
  }));
}

/** Solo para el modo local: deriva la rejilla pública (bloqueada/número/letra revelada) a
 * partir del crucigrama completo (con respuestas) descargado para un jugador en solitario. */
export function buildLocalGrid(puzzle: CrosswordPuzzle, solvedClueIds: ReadonlySet<string>): CrosswordCellView[][] {
  const meta = buildMeta(puzzle);
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

export function cluesAtCell(clues: CrosswordClueView[], row: number, col: number): CrosswordClueView[] {
  return clues.filter((c) => cellsForClue(c).some((cell) => cell.row === row && cell.col === col));
}

/** Al tocar una celda: si pertenece a dos palabras (cruce), alterna entre ellas al volver a
 * tocarla; si no, elige la que ya estuviera seleccionada o, por defecto, la horizontal. */
export function pickClueOnCellClick(
  clues: CrosswordClueView[],
  row: number,
  col: number,
  selectedClueId: string | null,
): string | null {
  const candidates = cluesAtCell(clues, row, col);
  if (candidates.length === 0) return selectedClueId;
  if (candidates.length === 1) return candidates[0].id;
  const current = candidates.find((c) => c.id === selectedClueId);
  if (current) {
    const other = candidates.find((c) => c.id !== current.id);
    return (other ?? current).id;
  }
  const across = candidates.find((c) => c.direction === 'across');
  return (across ?? candidates[0]).id;
}

export function buildLocalClues(puzzle: CrosswordPuzzle, solvedClueIds: ReadonlySet<string>): CrosswordClueView[] {
  return puzzle.clues.map((c) => ({
    id: c.id,
    number: c.number,
    direction: c.direction,
    row: c.row,
    col: c.col,
    length: c.length,
    clue: c.clue,
    solved: solvedClueIds.has(c.id),
    solvedBy: solvedClueIds.has(c.id) ? 'Tú' : null,
  }));
}
