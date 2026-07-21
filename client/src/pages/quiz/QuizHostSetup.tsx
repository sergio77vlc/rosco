import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR, PLAYER_COLORS, type QuizDifficulty } from '@rosco/shared';
import { useQuiz } from '../../context/QuizContext';
import AvatarPicker from '../../components/AvatarPicker';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS, QUIZ_DURATION_OPTIONS } from '../../constants';
import { saveSession } from '../../utils/session';

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 12;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 20;
const DIFFICULTY_OPTIONS: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];

export default function QuizHostSetup() {
  const navigate = useNavigate();
  const { emitWithAck, setPlayerId } = useQuiz();

  const [maxPlayers, setMaxPlayers] = useState(6);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medio');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(20);
  const [tvMode, setTvMode] = useState(false);
  const [hostName, setHostName] = useState('');
  const [hostColor, setHostColor] = useState<string>(PLAYER_COLORS[0]);
  const [hostAvatar, setHostAvatar] = useState<string>(DEFAULT_AVATAR);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreateRoom() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await emitWithAck<{ ok: true; code: string; hostToken: string }>('quiz:hostCreateRoom', {
        maxPlayers,
        difficulty,
        questionCount,
        questionDurationSeconds,
      });
      saveSession('quiz', res.code, { hostToken: res.hostToken });
      if (!tvMode) {
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('quiz:playerJoinRoom', {
          code: res.code,
          name: hostName.trim() || 'Jugador',
          color: hostColor,
          avatar: hostAvatar,
        });
        setPlayerId(joinRes.playerId);
        saveSession('quiz', res.code, { playerId: joinRes.playerId });
      }
      navigate(`/quiz/host/${res.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la partida.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Configurar quiz</h1>

      <section className="setup-section">
        <h2>Número máximo de jugadores</h2>
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
                ? 'Este dispositivo será solo el panel que muestra las preguntas y el marcador en directo.'
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
        <h2>Dificultad</h2>
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

      <section className="setup-section">
        <h2>Número de preguntas</h2>
        <div className="stepper">
          <button
            className="btn btn-icon"
            onClick={() => setQuestionCount((n) => Math.max(MIN_QUESTIONS, n - 1))}
          >
            −
          </button>
          <span className="stepper-value">{questionCount}</span>
          <button
            className="btn btn-icon"
            onClick={() => setQuestionCount((n) => Math.min(MAX_QUESTIONS, n + 1))}
          >
            +
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h2>Tiempo por pregunta</h2>
        <div className="pill-row">
          {QUIZ_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              className={`pill ${questionDurationSeconds === opt.seconds ? 'pill-active' : ''}`}
              onClick={() => setQuestionDurationSeconds(opt.seconds)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {createError && <p className="error-text">{createError}</p>}

      <button className="btn btn-primary btn-big" onClick={handleCreateRoom} disabled={creating}>
        {creating ? 'Creando...' : '🎬 Crear quiz'}
      </button>
    </div>
  );
}
