import React from 'react';
import type { CrosswordCellView, CrosswordClueView } from '@rosco/shared';
import { cellsForClue } from '../utils/crosswordGrid';

export interface CrosswordFocusHighlight {
  clueId: string;
  color: string;
}

interface CrosswordGridProps {
  grid: CrosswordCellView[][];
  clues: CrosswordClueView[];
  selectedClueId: string | null;
  focusHighlights?: CrosswordFocusHighlight[];
  onSelectCell: (row: number, col: number) => void;
}

export default function CrosswordGrid({ grid, clues, selectedClueId, focusHighlights = [], onSelectCell }: CrosswordGridProps) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const selectedClue = clues.find((c) => c.id === selectedClueId) ?? null;
  const selectedCells = new Set(
    selectedClue ? cellsForClue(selectedClue).map(({ row, col }) => `${row}-${col}`) : [],
  );

  const focusCellColor = new Map<string, string>();
  for (const fh of focusHighlights) {
    const clue = clues.find((c) => c.id === fh.clueId);
    if (!clue) continue;
    for (const { row, col } of cellsForClue(clue)) {
      focusCellColor.set(`${row}-${col}`, fh.color);
    }
  }

  return (
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols} / ${rows}` }}
    >
      {grid.map((rowCells, r) =>
        rowCells.map((cell, c) => {
          const key = `${r}-${c}`;
          if (cell.blocked) {
            return <div key={key} className="crossword-cell crossword-cell-blocked" />;
          }
          const isSelected = selectedCells.has(key);
          const focusColor = !isSelected ? focusCellColor.get(key) : undefined;
          return (
            <button
              key={key}
              type="button"
              className={`crossword-cell ${isSelected ? 'crossword-cell-selected' : ''}`}
              style={focusColor ? { boxShadow: `inset 0 0 0 3px ${focusColor}` } : undefined}
              onClick={() => onSelectCell(r, c)}
              aria-label={cell.letter ? `Celda ${cell.letter}` : 'Celda vacía'}
            >
              {cell.number != null && <span className="crossword-cell-number">{cell.number}</span>}
              {cell.letter && <span className="crossword-cell-letter">{cell.letter}</span>}
            </button>
          );
        }),
      )}
    </div>
  );
}
