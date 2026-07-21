import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAYER_AVATARS, PLAYER_COLORS, type Rosco, type RoscoSelection } from '@rosco/shared';
import RoscoPicker from '../../components/RoscoPicker';
import AvatarPicker from '../../components/AvatarPicker';
import AvatarView from '../../components/AvatarView';
import { TIMER_OPTIONS } from '../../constants';
import { useLocalGame } from '../../context/LocalGameContext';

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Jugador ${i + 1}`);
}

function defaultColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => PLAYER_COLORS[i % PLAYER_COLORS.length]);
}

function defaultAvatars(count: number): string[] {
  return Array.from({ length: count }, (_, i) => PLAYER_AVATARS[i % PLAYER_AVATARS.length]);
}

export default function LocalSetup() {
  const navigate = useNavigate();
  const { startGame } = useLocalGame();

  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(() => defaultNames(2));
  const [colors, setColors] = useState<string[]>(() => defaultColors(2));
  const [avatars, setAvatars] = useState<string[]>(() => defaultAvatars(2));
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [selectedRosco, setSelectedRosco] = useState<RoscoSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  function changePlayerCount(next: number) {
    const clamped = Math.min(6, Math.max(1, next));
    setPlayerCount(clamped);
    setNames((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push(`Jugador ${arr.length + 1}`);
      return arr.slice(0, clamped);
    });
    setColors((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push(PLAYER_COLORS[arr.length % PLAYER_COLORS.length]);
      return arr.slice(0, clamped);
    });
    setAvatars((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push(PLAYER_AVATARS[arr.length % PLAYER_AVATARS.length]);
      return arr.slice(0, clamped);
    });
  }

  async function handleStart() {
    if (!selectedRosco) {
      setError('Elige un rosco antes de empezar.');
      return;
    }
    setError(null);
    const players = names.map((name, i) => ({
      name: name.trim() || `Jugador ${i + 1}`,
      color: colors[i],
      avatar: avatars[i],
    }));
    setStarting(true);
    try {
      let roscoPool: Rosco[];
      if (selectedRosco.mode === 'ai') {
        roscoPool = [selectedRosco.rosco];
      } else {
        const res = await fetch('/api/rosco/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty: selectedRosco.difficulty, count: playerCount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudieron repartir los roscos.');
        roscoPool = data.roscos;
      }
      startGame(roscoPool, timerSeconds, players);
      navigate('/local/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo empezar la partida.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Jugar en este dispositivo</h1>
      <p className="app-subtitle">
        Os turnáis en el mismo móvil o pantalla: cada jugador tiene su propio rosco, pero solo
        responde uno a la vez. Si acierta sigue él; si falla o pasa palabra, el turno pasa al
        siguiente jugador.
      </p>

      <section className="setup-section">
        <h2>Número de jugadores</h2>
        <div className="stepper">
          <button className="btn btn-icon" onClick={() => changePlayerCount(playerCount - 1)}>
            −
          </button>
          <span className="stepper-value">{playerCount}</span>
          <button className="btn btn-icon" onClick={() => changePlayerCount(playerCount + 1)}>
            +
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h2>Jugadores</h2>
        <div className="local-player-list">
          {names.map((name, i) => (
            <div key={i} className="local-player-card">
              <div className="local-player-row">
                <button
                  type="button"
                  className="local-player-avatar-btn"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  aria-label={`Cambiar avatar de jugador ${i + 1}`}
                >
                  <AvatarView avatar={avatars[i]} color={colors[i]} size={40} />
                </button>
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                  placeholder={`Jugador ${i + 1}`}
                  maxLength={20}
                />
                <div className="local-player-colors">
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch color-swatch-small ${colors[i] === c ? 'color-swatch-active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColors((prev) => prev.map((col, idx) => (idx === i ? c : col)))}
                      aria-label={`Elegir color ${c} para jugador ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              {expandedIndex === i && (
                <AvatarPicker
                  value={avatars[i]}
                  color={colors[i]}
                  onChange={(a) => setAvatars((prev) => prev.map((av, idx) => (idx === i ? a : av)))}
                />
              )}
            </div>
          ))}
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

      <RoscoPicker value={selectedRosco} onChange={setSelectedRosco} />

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-big" onClick={handleStart} disabled={!selectedRosco || starting}>
        {starting ? 'Repartiendo roscos...' : '🚀 Empezar'}
      </button>
    </div>
  );
}
