import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MII_CONFIG, type MiiConfig, type QuizDifficulty, type QuizQuestion } from '@rosco/shared';
import MiiAvatar from '../../components/MiiAvatar';
import MiiEditor from '../../components/MiiEditor';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS } from '../../constants';
import { useLocalBattle } from '../../context/BattleLocalContext';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const QUESTION_POOL_SIZE = 80;
const DIFFICULTY_OPTIONS: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Jugador ${i + 1}`);
}

function defaultMiis(count: number): MiiConfig[] {
  return Array.from({ length: count }, () => ({ ...DEFAULT_MII_CONFIG }));
}

export default function BattleLocalSetup() {
  const navigate = useNavigate();
  const { startGame } = useLocalBattle();

  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(() => defaultNames(2));
  const [miis, setMiis] = useState<MiiConfig[]>(() => defaultMiis(2));
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medio');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  function changePlayerCount(next: number) {
    const clamped = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, next));
    setPlayerCount(clamped);
    setNames((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push(`Jugador ${arr.length + 1}`);
      return arr.slice(0, clamped);
    });
    setMiis((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push({ ...DEFAULT_MII_CONFIG });
      return arr.slice(0, clamped);
    });
  }

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch('/api/quiz/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, count: QUESTION_POOL_SIZE }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron repartir las preguntas.');
      const questionPool: QuizQuestion[] = data.questions;
      const players = names.map((name, i) => ({ name: name.trim() || `Jugador ${i + 1}`, mii: miis[i] }));
      startGame(questionPool, players);
      navigate('/battle/local/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo empezar la partida.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Batalla en este dispositivo</h1>
      <p className="app-subtitle">
        Os turnáis en el mismo móvil o pantalla. Acierta preguntas para elegir un arma y atacar a un
        rival. ¡El último en pie gana!
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
                  aria-label={`Personalizar personaje de jugador ${i + 1}`}
                >
                  <MiiAvatar mii={miis[i]} size={56} />
                </button>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
                  placeholder={`Jugador ${i + 1}`}
                  maxLength={20}
                />
              </div>
              {expandedIndex === i && (
                <MiiEditor
                  value={miis[i]}
                  onChange={(m) => setMiis((prev) => prev.map((mm, idx) => (idx === i ? m : mm)))}
                />
              )}
            </div>
          ))}
        </div>
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

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-big" onClick={handleStart} disabled={starting}>
        {starting ? 'Repartiendo preguntas...' : '⚔️ Empezar batalla'}
      </button>
    </div>
  );
}
