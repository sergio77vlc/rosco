import React, { useState } from 'react';
import type { Difficulty, RoscoSelection } from '@rosco/shared';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../constants';

const ROSCO_THEME = 'cultura general';

interface RoscoPickerProps {
  value: RoscoSelection | null;
  onChange: (selection: RoscoSelection) => void;
}

export default function RoscoPicker({ value, onChange }: RoscoPickerProps) {
  const [tab, setTab] = useState<'preset' | 'ai'>('preset');

  const [aiTheme, setAiTheme] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medio');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function choosePresetDifficulty(difficulty: Difficulty) {
    onChange({ mode: 'preset', theme: ROSCO_THEME, difficulty });
  }

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
      onChange({ mode: 'ai', rosco: data.rosco });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error generando el rosco.');
    } finally {
      setAiLoading(false);
    }
  }

  const themeInfo = categoryInfo(ROSCO_THEME);

  return (
    <section className="setup-section">
      <h2>Rosco</h2>
      <div className="tab-row">
        <button className={`tab ${tab === 'preset' ? 'tab-active' : ''}`} onClick={() => setTab('preset')}>
          🎯 Predefinido
        </button>
        <button className={`tab ${tab === 'ai' ? 'tab-active' : ''}`} onClick={() => setTab('ai')}>
          ✨ Generar con IA
        </button>
      </div>

      {tab === 'preset' && (
        <div className="preset-picker">
          <h3 className="category-heading">
            {themeInfo.icon} {themeInfo.label}
          </h3>
          <p className="preset-picker-hint">Elige la dificultad, el rosco se asigna automáticamente.</p>
          <div className="pill-row">
            {(['medio', 'dificil'] as const).map((d) => (
              <button
                key={d}
                className={`pill ${value?.mode === 'preset' && value.difficulty === d ? 'pill-active' : ''}`}
                onClick={() => choosePresetDifficulty(d)}
              >
                {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
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
              {(['medio', 'dificil'] as const).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={handleGenerateAi} disabled={aiLoading || !aiTheme.trim()}>
            {aiLoading ? '✨ Generando...' : '✨ Generar rosco'}
          </button>
          {aiError && <p className="error-text">{aiError}</p>}
          {value?.mode === 'ai' && <p className="success-text">Rosco generado: "{value.rosco.title}" ✅</p>}
        </div>
      )}

      {value?.mode === 'preset' && (
        <p className="setup-selected">
          🎯 {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[value.difficulty]} {DIFFICULTY_LABELS[value.difficulty]}
        </p>
      )}
      {value?.mode === 'ai' && (
        <p className="setup-selected">
          🎯 Rosco seleccionado: <strong>{value.rosco.title}</strong>
        </p>
      )}
    </section>
  );
}
