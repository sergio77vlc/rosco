import React, { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Rosco } from '@rosco/shared';
import { CATEGORY_ORDER, DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../constants';

interface RoscoPickerProps {
  value: Rosco | null;
  onChange: (rosco: Rosco) => void;
}

export default function RoscoPicker({ value, onChange }: RoscoPickerProps) {
  const [tab, setTab] = useState<'preset' | 'ai'>('preset');

  const [presets, setPresets] = useState<Rosco[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
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

  const categories = useMemo(() => {
    const themes = new Set(presets.map((r) => r.theme));
    const ordered = CATEGORY_ORDER.filter((t) => themes.has(t));
    const rest = [...themes].filter((t) => !CATEGORY_ORDER.includes(t)).sort();
    return [...ordered, ...rest];
  }, [presets]);

  const roscosInCategory = useMemo(
    () => presets.filter((r) => r.theme === category),
    [presets, category],
  );

  const filteredRoscos = useMemo(
    () => roscosInCategory.filter((r) => difficultyFilter === 'todas' || r.difficulty === difficultyFilter),
    [roscosInCategory, difficultyFilter],
  );

  const countByDifficulty = useMemo(() => {
    const counts: Record<Difficulty, number> = { facil: 0, medio: 0, dificil: 0 };
    roscosInCategory.forEach((r) => counts[r.difficulty]++);
    return counts;
  }, [roscosInCategory]);

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
          🎯 Predefinido
        </button>
        <button className={`tab ${tab === 'ai' ? 'tab-active' : ''}`} onClick={() => setTab('ai')}>
          ✨ Generar con IA
        </button>
      </div>

      {tab === 'preset' && (
        <div className="preset-picker">
          {presetsError && <p className="error-text">{presetsError}</p>}

          {!category && (
            <div className="category-grid">
              {categories.map((theme) => {
                const info = categoryInfo(theme);
                const count = presets.filter((r) => r.theme === theme).length;
                return (
                  <button key={theme} type="button" className="category-card" onClick={() => setCategory(theme)}>
                    <span className="category-card-icon">{info.icon}</span>
                    <span className="category-card-label">{info.label}</span>
                    <span className="category-card-count">{count} roscos</span>
                  </button>
                );
              })}
            </div>
          )}

          {category && (
            <>
              <button type="button" className="category-back" onClick={() => setCategory(null)}>
                ← Todas las categorías
              </button>
              <h3 className="category-heading">
                {categoryInfo(category).icon} {categoryInfo(category).label}
              </h3>
              <div className="pill-row">
                {(['todas', 'facil', 'medio', 'dificil'] as const).map((d) => (
                  <button
                    key={d}
                    className={`pill ${difficultyFilter === d ? 'pill-active' : ''}`}
                    onClick={() => setDifficultyFilter(d)}
                  >
                    {d === 'todas' ? `Todas (${roscosInCategory.length})` : `${DIFFICULTY_ICONS[d]} ${DIFFICULTY_LABELS[d]} (${countByDifficulty[d]})`}
                  </button>
                ))}
              </div>
              <div className="preset-list">
                {filteredRoscos.map((r) => (
                  <button
                    key={r.id}
                    className={`preset-card ${value?.id === r.id ? 'preset-card-active' : ''}`}
                    onClick={() => onChange(r)}
                  >
                    <strong>{r.title}</strong>
                    <span>
                      {DIFFICULTY_ICONS[r.difficulty]} {DIFFICULTY_LABELS[r.difficulty]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
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
                  {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={handleGenerateAi} disabled={aiLoading || !aiTheme.trim()}>
            {aiLoading ? '✨ Generando...' : '✨ Generar rosco'}
          </button>
          {aiError && <p className="error-text">{aiError}</p>}
          {value?.source === 'ai' && <p className="success-text">Rosco generado: "{value.title}" ✅</p>}
        </div>
      )}

      {value && (
        <p className="setup-selected">
          🎯 Rosco seleccionado: <strong>{value.title}</strong>
        </p>
      )}
    </section>
  );
}
