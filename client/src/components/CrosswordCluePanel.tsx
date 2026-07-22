import React, { useEffect, useState } from 'react';
import type { CrosswordClueView } from '@rosco/shared';

interface CrosswordCluePanelProps {
  clues: CrosswordClueView[];
  selectedClueId: string | null;
  onSelectClue: (clueId: string) => void;
  /** Si se omite, el panel es de solo lectura (sin campo de respuesta). */
  onSubmit?: (clueId: string, answerText: string) => Promise<boolean> | boolean;
}

export default function CrosswordCluePanel({ clues, selectedClueId, onSelectClue, onSubmit }: CrosswordCluePanelProps) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedClue = clues.find((c) => c.id === selectedClueId) ?? null;

  useEffect(() => {
    setAnswer('');
    setWrong(false);
  }, [selectedClueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClue || !onSubmit || !answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const correct = await onSubmit(selectedClue.id, answer.trim());
      if (correct) {
        setAnswer('');
        setWrong(false);
      } else {
        setWrong(true);
        setTimeout(() => setWrong(false), 1200);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const across = clues.filter((c) => c.direction === 'across');
  const down = clues.filter((c) => c.direction === 'down');

  return (
    <div className="crossword-clue-panel">
      {selectedClue ? (
        <div
          className={`crossword-clue-active ${wrong ? 'crossword-clue-wrong' : ''} ${selectedClue.solved ? 'crossword-clue-solved' : ''}`}
        >
          <span className="crossword-clue-active-number">
            {selectedClue.number} {selectedClue.direction === 'across' ? 'Horizontal' : 'Vertical'} · {selectedClue.length} letras
          </span>
          <p className="crossword-clue-active-text">{selectedClue.clue}</p>
          {selectedClue.solved ? (
            <p className="crossword-clue-solved-by">✅ Resuelta por {selectedClue.solvedBy}</p>
          ) : onSubmit ? (
            <form className="crossword-answer-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Tu respuesta"
                maxLength={selectedClue.length + 8}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={submitting || !answer.trim()}>
                ✓
              </button>
            </form>
          ) : null}
          {wrong && <p className="error-text">No es correcta, ¡sigue intentando!</p>}
        </div>
      ) : (
        <p className="crossword-clue-hint">Toca una palabra en la rejilla o en la lista para ver su definición.</p>
      )}

      <div className="crossword-clue-lists">
        <div className="crossword-clue-list">
          <h3>Horizontales</h3>
          {across.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`crossword-clue-item ${c.solved ? 'crossword-clue-item-solved' : ''} ${c.id === selectedClueId ? 'crossword-clue-item-active' : ''}`}
              onClick={() => onSelectClue(c.id)}
            >
              <span className="crossword-clue-item-number">{c.number}.</span>
              <span className="crossword-clue-item-text">{c.clue}</span>
              {c.solved && <span className="crossword-clue-item-check">✓</span>}
            </button>
          ))}
        </div>
        <div className="crossword-clue-list">
          <h3>Verticales</h3>
          {down.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`crossword-clue-item ${c.solved ? 'crossword-clue-item-solved' : ''} ${c.id === selectedClueId ? 'crossword-clue-item-active' : ''}`}
              onClick={() => onSelectClue(c.id)}
            >
              <span className="crossword-clue-item-number">{c.number}.</span>
              <span className="crossword-clue-item-text">{c.clue}</span>
              {c.solved && <span className="crossword-clue-item-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
