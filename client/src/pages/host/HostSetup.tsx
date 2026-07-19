import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR, PLAYER_COLORS, type Rosco } from '@rosco/shared';
import { useGame } from '../../context/GameContext';
import RoscoPicker from '../../components/RoscoPicker';
import AvatarPicker from '../../components/AvatarPicker';
import { TIMER_OPTIONS } from '../../constants';

export default function HostSetup() {
  const navigate = useNavigate();
  const { emitWithAck, setPlayerId } = useGame();

  const [maxPlayers, setMaxPlayers] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [soloName, setSoloName] = useState('');
  const [soloColor, setSoloColor] = useState<string>(PLAYER_COLORS[0]);
  const [soloAvatar, setSoloAvatar] = useState<string>(DEFAULT_AVATAR);
  const isSolo = maxPlayers === 1;

  const [selectedRosco, setSelectedRosco] = useState<Rosco | null>(null);

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
        rosco: selectedRosco,
        timerSeconds,
      });
      if (isSolo) {
        // Con un solo jugador no hace falta pantalla de anfitrión/QR: este mismo dispositivo
        // se une directamente como jugador y la partida arranca sin esperar a nadie.
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('player:joinRoom', {
          code: res.code,
          name: soloName.trim() || 'Jugador',
          color: soloColor,
          avatar: soloAvatar,
        });
        setPlayerId(joinRes.playerId);
        navigate(`/play/${res.code}`);
      } else {
        navigate(`/host/${res.code}`);
      }
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
        {isSolo && (
          <p className="app-subtitle setup-solo-hint">
            Vas a jugar tú solo: no hará falta código ni pantalla de anfitrión, se empieza directo.
          </p>
        )}
      </section>

      {isSolo && (
        <section className="setup-section">
          <h2>Tu nombre</h2>
          <input
            type="text"
            value={soloName}
            onChange={(e) => setSoloName(e.target.value)}
            placeholder="Nombre"
            maxLength={20}
            className="setup-solo-name-input"
          />
          <div className="color-picker">
            {PLAYER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${soloColor === c ? 'color-swatch-active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setSoloColor(c)}
                aria-label={`Elegir color ${c}`}
              />
            ))}
          </div>
          <AvatarPicker value={soloAvatar} color={soloColor} onChange={setSoloAvatar} />
        </section>
      )}

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
        {creating ? 'Creando...' : isSolo ? '🚀 Empezar a jugar' : '🎬 Crear partida'}
      </button>
    </div>
  );
}
