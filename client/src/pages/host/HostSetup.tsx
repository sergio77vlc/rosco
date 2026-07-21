import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR, PLAYER_COLORS, type RoscoSelection } from '@rosco/shared';
import { useGame } from '../../context/GameContext';
import RoscoPicker from '../../components/RoscoPicker';
import AvatarPicker from '../../components/AvatarPicker';
import { TIMER_OPTIONS } from '../../constants';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

export default function HostSetup() {
  const navigate = useNavigate();
  const { emitWithAck, setPlayerId } = useGame();

  const [maxPlayers, setMaxPlayers] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [tvMode, setTvMode] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostColor, setHostColor] = useState<string>(PLAYER_COLORS[0]);
  const [hostAvatar, setHostAvatar] = useState<string>(DEFAULT_AVATAR);

  const [selectedRosco, setSelectedRosco] = useState<RoscoSelection | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
        selection: selectedRosco,
        timerSeconds,
      });
      if (!tvMode) {
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('player:joinRoom', {
          code: res.code,
          name: hostName.trim() || 'Jugador',
          color: hostColor,
          avatar: hostAvatar,
        });
        setPlayerId(joinRes.playerId);
      }
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
          <button
            className="btn btn-icon"
            onClick={() => setMaxPlayers((n) => Math.max(MIN_PLAYERS, n - 1))}
          >
            −
          </button>
          <span className="stepper-value">{maxPlayers}</span>
          <button
            className="btn btn-icon"
            onClick={() => setMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}
          >
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
                ? 'Este dispositivo será solo el panel que muestra todos los roscos en directo.'
                : 'Este dispositivo juega también como uno más, además de mostrar la partida.'}
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
            <div className="color-picker">
              {PLAYER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch ${hostColor === c ? 'color-swatch-active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setHostColor(c)}
                  aria-label={`Elegir color ${c}`}
                />
              ))}
            </div>
            <AvatarPicker value={hostAvatar} color={hostColor} onChange={setHostAvatar} />
          </div>
        )}
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

      <RoscoPicker value={selectedRosco} onChange={setSelectedRosco} />

      {createError && <p className="error-text">{createError}</p>}

      <button className="btn btn-primary btn-big" onClick={handleCreateRoom} disabled={creating || !selectedRosco}>
        {creating ? 'Creando...' : '🎬 Crear partida'}
      </button>
    </div>
  );
}
