import React, { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Rosco } from '@rosco/shared';
import { DIFFICULTY_LABELS } from '../constants';

interface RoscoPickerProps {
  value: Rosco | null;
  onChange: (rosco: Rosco) => void;
}

export default function RoscoPicker({ value, onChange }: RoscoPickerProps) {
  const [tab, setTab] = useState<'preset' | 'ai'>('preset');

  const [presets, setPresets] = useState<Rosco[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'todas'>('todas');

  const [aiTheme, setAiTheme] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medio');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rosco/presets')
      .then((res) => res.json())
      .then((data) => setPresets(data.roscos ?? []))
      .catch(() => setPresetsError('No se pudieron cargar los roscos predefinidos.'));
  }, []);

  const filteredPresets = useMemo(
    () => presets.filter((r) => difficultyFilter === 'todas' || r.difficulty === difficultyFilter),
    [presets, difficultyFilter],
  );

  async function handleGenerateAi() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/rosco/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: aiTheme, difficulty: aiDifficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el rosco.');
      onChange(data.rosco);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error generando el rosco.');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section className="setup-section">
      <h2>Rosco</h2>
      <div className="tab-row">
        <button className={`tab ${tab === 'preset' ? 'tab-active' : ''}`} onClick={() => setTab('preset')}>
          Predefinido
        </button>
        <button className={`tab ${tab === 'ai' ? 'tab-active' : ''}`} onClick={() => setTab('ai')}>
          Generar con IA
        </button>
      </div>

      {tab === 'preset' && (
        <div className="preset-picker">
          <div className="pill-row">
            {(['todas', 'facil', 'medio', 'dificil'] as const).map((d) => (
              <button
                key={d}
                className={`pill ${difficultyFilter === d ? 'pill-active' : ''}`}
                onClick={() => setDifficultyFilter(d)}
              >
                {d === 'todas' ? 'Todas' : DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          {presetsError && <p className="error-text">{presetsError}</p>}
          <div className="preset-list">
            {filteredPresets.map((r) => (
              <button
                key={r.id}
                className={`preset-card ${value?.id === r.id ? 'preset-card-active' : ''}`}
                onClick={() => onChange(r)}
              >
                <strong>{r.title}</strong>
                <span>
                  {DIFFICULTY_LABELS[r.difficulty]} · {r.theme}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="ai-picker">
          <label>
            Tema del rosco
            <input
              type="text"
              placeholder="Ej: Star Wars, la Antigua Roma, videojuegos..."
              value={aiTheme}
              onChange={(e) => setAiTheme(e.target.value)}
              maxLength={120}
            />
          </label>
          <label>
            Dificultad
            <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}>
              {(['facil', 'medio', 'dificil'] as const).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={handleGenerateAi} disabled={aiLoading || !aiTheme.trim()}>
            {aiLoading ? 'Generando...' : 'Generar rosco'}
          </button>
          {aiError && <p className="error-text">{aiError}</p>}
          {value?.source === 'ai' && <p className="success-text">Rosco generado: "{value.title}" ✅</p>}
        </div>
      )}

      {value && (
        <p className="setup-selected">
          Rosco seleccionado: <strong>{value.title}</strong>
        </p>
      )}
    </section>
  );
}
