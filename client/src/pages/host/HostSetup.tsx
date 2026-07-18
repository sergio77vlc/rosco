import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, Rosco } from '@rosco/shared';
import { useGame } from '../../context/GameContext';

const TIMER_OPTIONS = [
  { label: '1:30 min', seconds: 90 },
  { label: '2:00 min', seconds: 120 },
  { label: '3:00 min', seconds: 180 },
  { label: '4:00 min', seconds: 240 },
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

export default function HostSetup() {
  const navigate = useNavigate();
  const { emitWithAck } = useGame();

  const [maxPlayers, setMaxPlayers] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [tab, setTab] = useState<'preset' | 'ai'>('preset');

  const [presets, setPresets] = useState<Rosco[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'todas'>('todas');
  const [selectedRosco, setSelectedRosco] = useState<Rosco | null>(null);

  const [aiTheme, setAiTheme] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medio');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
      setSelectedRosco(data.rosco);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error generando el rosco.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreateRoom() {
    if (!selectedRosco) {
      setCreateError('Elige un rosco antes de crear la partida.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await emitWithAck<{ ok: true; code: string }>('host:createRoom', {
        maxPlayers,
        rosco: selectedRosco,
        timerSeconds,
      });
      navigate(`/host/${res.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la partida.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Configurar partida</h1>

      <section className="setup-section">
        <h2>Número de jugadores</h2>
        <div className="stepper">
          <button className="btn btn-icon" onClick={() => setMaxPlayers((n) => Math.max(1, n - 1))}>
            −
          </button>
          <span className="stepper-value">{maxPlayers}</span>
          <button className="btn btn-icon" onClick={() => setMaxPlayers((n) => Math.min(6, n + 1))}>
            +
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h2>Duración de la partida</h2>
        <div className="pill-row">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              className={`pill ${timerSeconds === opt.seconds ? 'pill-active' : ''}`}
              onClick={() => setTimerSeconds(opt.seconds)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

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
                  className={`preset-card ${selectedRosco?.id === r.id ? 'preset-card-active' : ''}`}
                  onClick={() => setSelectedRosco(r)}
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
            {selectedRosco?.source === 'ai' && (
              <p className="success-text">Rosco generado: "{selectedRosco.title}" ✅</p>
            )}
          </div>
        )}
      </section>

      {selectedRosco && (
        <p className="setup-selected">
          Rosco seleccionado: <strong>{selectedRosco.title}</strong>
        </p>
      )}
      {createError && <p className="error-text">{createError}</p>}

      <button className="btn btn-primary btn-big" onClick={handleCreateRoom} disabled={creating || !selectedRosco}>
        {creating ? 'Creando...' : 'Crear partida'}
      </button>
    </div>
  );
}
