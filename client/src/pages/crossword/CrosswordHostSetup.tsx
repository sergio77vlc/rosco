import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR, DEFAULT_PLAYER_COLOR, type CrosswordSummary, type Difficulty } from '@rosco/shared';
import { useCrossword } from '../../context/CrosswordContext';
import AvatarPicker from '../../components/AvatarPicker';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../../constants';
import { saveSession } from '../../utils/session';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

export default function CrosswordHostSetup() {
  const navigate = useNavigate();
  const { emitWithAck, setPlayerId } = useCrossword();

  const [maxPlayers, setMaxPlayers] = useState(4);
  const [tvMode, setTvMode] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostAvatar, setHostAvatar] = useState<string>(DEFAULT_AVATAR);

  const [puzzles, setPuzzles] = useState<CrosswordSummary[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'todas'>('todas');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crossword/puzzles')
      .then((res) => res.json())
      .then((data) => setPuzzles(data.puzzles ?? []))
      .catch(() => {})
      .finally(() => setLoadingPuzzles(false));
  }, []);

  const filteredPuzzles = puzzles.filter((p) => difficultyFilter === 'todas' || p.difficulty === difficultyFilter);

  async function handleCreateRoom() {
    if (!selectedPuzzleId) {
      setCreateError('Elige un crucigrama antes de crear la partida.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await emitWithAck<{ ok: true; code: string; hostToken: string }>('crossword:hostCreateRoom', {
        maxPlayers,
        puzzleId: selectedPuzzleId,
      });
      saveSession('crossword', res.code, { hostToken: res.hostToken });
      if (!tvMode) {
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('crossword:playerJoinRoom', {
          code: res.code,
          name: hostName.trim() || 'Jugador',
          color: DEFAULT_PLAYER_COLOR,
          avatar: hostAvatar,
        });
        setPlayerId(joinRes.playerId);
        saveSession('crossword', res.code, { playerId: joinRes.playerId });
      }
      navigate(`/crossword/host/${res.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la partida.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Configurar crucigrama</h1>

      <section className="setup-section">
        <h2>Número máximo de jugadores</h2>
        <div className="stepper">
          <button className="btn btn-icon" onClick={() => setMaxPlayers((n) => Math.max(MIN_PLAYERS, n - 1))}>
            −
          </button>
          <span className="stepper-value">{maxPlayers}</span>
          <button className="btn btn-icon" onClick={() => setMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}>
            +
          </button>
        </div>
      </section>

      <section className="setup-section">
        <label className="switch-row">
          <span>
            <strong>📺 Usar dispositivo en modo TV</strong>
            <span className="switch-row-hint">
              {tvMode
                ? 'Activado: este dispositivo será solo la pantalla de monitorización, con el crucigrama en directo. No juega.'
                : 'Por defecto (desactivado): el anfitrión es un jugador más. No se muestra ninguna pantalla de monitorización en ningún dispositivo.'}
            </span>
          </span>
          <input
            type="checkbox"
            className="switch-input"
            checked={tvMode}
            onChange={(e) => setTvMode(e.target.checked)}
          />
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
        </label>

        {!tvMode && (
          <div className="setup-solo-fields">
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={20}
              className="setup-solo-name-input"
            />
            <AvatarPicker value={hostAvatar} onChange={setHostAvatar} />
          </div>
        )}
      </section>

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

      {createError && <p className="error-text">{createError}</p>}

      <button className="btn btn-primary btn-big" onClick={handleCreateRoom} disabled={creating || !selectedPuzzleId}>
        {creating ? 'Creando...' : '🎬 Crear partida'}
      </button>
    </div>
  );
}
