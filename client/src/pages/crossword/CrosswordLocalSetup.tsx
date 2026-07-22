import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CrosswordPuzzle, CrosswordSummary, Difficulty } from '@rosco/shared';
import { useLocalCrossword } from '../../context/CrosswordLocalContext';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../../constants';

export default function CrosswordLocalSetup() {
  const navigate = useNavigate();
  const { setPuzzle } = useLocalCrossword();

  const [puzzles, setPuzzles] = useState<CrosswordSummary[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'todas'>('todas');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crossword/puzzles')
      .then((res) => res.json())
      .then((data) => setPuzzles(data.puzzles ?? []))
      .catch(() => {})
      .finally(() => setLoadingPuzzles(false));
  }, []);

  const filteredPuzzles = puzzles.filter((p) => difficultyFilter === 'todas' || p.difficulty === difficultyFilter);

  async function handleStart() {
    if (!selectedPuzzleId) {
      setError('Elige un crucigrama antes de empezar.');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/crossword/puzzles/${selectedPuzzleId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el crucigrama.');
      const puzzle: CrosswordPuzzle = data.puzzle;
      setPuzzle(puzzle);
      navigate('/crossword/local/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo empezar la partida.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Crucigrama en este dispositivo</h1>
      <p className="app-subtitle">Resuelve tú solo, sin límite de tiempo. Suma puntos por cada palabra que aciertes.</p>

      <section className="setup-section">
        <h2>Crucigrama</h2>
        <div className="pill-row">
          <button
            className={`pill ${difficultyFilter === 'todas' ? 'pill-active' : ''}`}
            onClick={() => setDifficultyFilter('todas')}
          >
            Todas
          </button>
          {(['medio', 'dificil'] as const).map((d) => (
            <button
              key={d}
              className={`pill ${difficultyFilter === d ? 'pill-active' : ''}`}
              onClick={() => setDifficultyFilter(d)}
            >
              {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        {loadingPuzzles && <p className="app-subtitle">Cargando crucigramas...</p>}
        <div className="crossword-puzzle-list">
          {filteredPuzzles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`crossword-puzzle-option ${selectedPuzzleId === p.id ? 'crossword-puzzle-option-active' : ''}`}
              onClick={() => setSelectedPuzzleId(p.id)}
            >
              <span className="crossword-puzzle-option-title">{p.title}</span>
              <span className="crossword-puzzle-option-meta">
                {DIFFICULTY_ICONS[p.difficulty]} {DIFFICULTY_LABELS[p.difficulty]} · {p.wordCount} palabras
              </span>
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-big" onClick={handleStart} disabled={starting || !selectedPuzzleId}>
        {starting ? 'Cargando...' : '🚀 Empezar'}
      </button>
    </div>
  );
}
