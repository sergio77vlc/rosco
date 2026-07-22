import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR, DEFAULT_PLAYER_COLOR, type PackSummary, type QuizDifficulty } from '@rosco/shared';
import { useQuiz } from '../../context/QuizContext';
import AvatarPicker from '../../components/AvatarPicker';
import ContentPackPicker from '../../components/ContentPackPicker';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS, QUIZ_DURATION_OPTIONS } from '../../constants';
import { saveSession } from '../../utils/session';

const MIN_PLAYERS = 2;
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
  const [hostAvatar, setHostAvatar] = useState<string>(DEFAULT_AVATAR);
  const [packPickerOpen, setPackPickerOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<PackSummary | null>(null);

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
        packId: selectedPack?.id,
      });
      saveSession('quiz', res.code, { hostToken: res.hostToken });
      if (!tvMode) {
        const joinRes = await emitWithAck<{ ok: true; playerId: string }>('quiz:playerJoinRoom', {
          code: res.code,
          name: hostName.trim() || 'Jugador',
          color: DEFAULT_PLAYER_COLOR,
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
                ? 'Activado: este dispositivo será solo la pantalla de monitorización, con las preguntas y el marcador en directo. No juega.'
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
        <h2>Preguntas</h2>
        <p className="preset-picker-hint">Modo rápido: elige la dificultad de cultura general.</p>
        <div className="pill-row">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              className={`pill ${!selectedPack && difficulty === d ? 'pill-active' : ''}`}
              onClick={() => {
                setDifficulty(d);
                setSelectedPack(null);
              }}
            >
              {QUIZ_DIFFICULTY_ICONS[d]} {QUIZ_DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary pack-picker-open-btn"
          onClick={() => setPackPickerOpen(true)}
        >
          📦 Elegir o crear un paquete guardado con IA
        </button>
        {selectedPack && (
          <p className="setup-selected pack-selected">
            🎯 Paquete seleccionado: <strong>{selectedPack.name}</strong> ({selectedPack.count} preguntas)
          </p>
        )}
        <ContentPackPicker
          domain="quiz"
          open={packPickerOpen}
          onClose={() => setPackPickerOpen(false)}
          onSelect={setSelectedPack}
        />
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
