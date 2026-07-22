import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MII_CONFIG, type MiiConfig, type QuizDifficulty } from '@rosco/shared';
import { useBattle } from '../../context/BattleContext';
import MiiEditor from '../../components/MiiEditor';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS } from '../../constants';
import { saveSession } from '../../utils/session';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const DIFFICULTY_OPTIONS: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];

export default function BattleHostSetup() {
  const navigate = useNavigate();
  const { emitWithAck, setPlayerId } = useBattle();

  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medio');
  const [tvMode, setTvMode] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostMii, setHostMii] = useState<MiiConfig>(DEFAULT_MII_CONFIG);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreateRoom() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await emitWithAck<{ ok: true; code: string; hostToken: string }>('battle:hostCreateRoom', {
        maxPlayers,
        difficulty,
      });
      saveSession('battle', res.code, { hostToken: res.hostToken });
      if (!tvMode) {
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('battle:playerJoinRoom', {
          code: res.code,
          name: hostName.trim() || 'Jugador',
          mii: hostMii,
        });
        setPlayerId(joinRes.playerId);
        saveSession('battle', res.code, { playerId: joinRes.playerId });
      }
      navigate(`/battle/host/${res.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la partida.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Configurar batalla</h1>

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
                ? 'Activado: este dispositivo será solo la pantalla de monitorización, con la batalla en directo. No juega.'
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
            <MiiEditor value={hostMii} onChange={setHostMii} />
          </div>
        )}
      </section>

      <section className="setup-section">
        <h2>Dificultad de las preguntas</h2>
        <div className="pill-row">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              className={`pill ${difficulty === d ? 'pill-active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {QUIZ_DIFFICULTY_ICONS[d]} {QUIZ_DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </section>

      {createError && <p className="error-text">{createError}</p>}

      <button className="btn btn-primary btn-big" onClick={handleCreateRoom} disabled={creating}>
        {creating ? 'Creando...' : '🎬 Crear batalla'}
      </button>
    </div>
  );
}
