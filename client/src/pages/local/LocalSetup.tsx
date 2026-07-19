import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAYER_COLORS, type Rosco } from '@rosco/shared';
import RoscoPicker from '../../components/RoscoPicker';
import { TIMER_OPTIONS } from '../../constants';
import { useLocalGame } from '../../context/LocalGameContext';

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Jugador ${i + 1}`);
}

function defaultColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => PLAYER_COLORS[i % PLAYER_COLORS.length]);
}

export default function LocalSetup() {
  const navigate = useNavigate();
  const { startGame } = useLocalGame();

  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(() => defaultNames(2));
  const [colors, setColors] = useState<string[]>(() => defaultColors(2));
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [selectedRosco, setSelectedRosco] = useState<Rosco | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }

  function handleStart() {
    if (!selectedRosco) {
      setError('Elige un rosco antes de empezar.');
      return;
    }
    setError(null);
    const players = names.map((name, i) => ({ name: name.trim() || `Jugador ${i + 1}`, color: colors[i] }));
    startGame(selectedRosco, timerSeconds, players);
    navigate('/local/play');
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
            <div key={i} className="local-player-row">
              <span className="color-swatch local-player-swatch" style={{ backgroundColor: colors[i] }} />
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

      <button className="btn btn-primary btn-big" onClick={handleStart} disabled={!selectedRosco}>
        Empezar
      </button>
    </div>
  );
}
