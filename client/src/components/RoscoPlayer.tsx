import React, { useEffect, useRef, useState } from 'react';
import type { LetterClue, PlayerProgressEntry } from '@rosco/shared';
import RoscoWheel from './RoscoWheel';
import Timer from './Timer';
import AvatarView from './AvatarView';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface RoscoPlayerProps {
  letters: Omit<LetterClue, 'answer'>[];
  progress: PlayerProgressEntry[];
  currentIndex: number;
  finished: boolean;
  endsAt: number | null;
  onSubmitAnswer: (answerText: string) => void;
  onPass: () => void;
  doneMessage?: string;
  playerName: string;
  playerAvatar: string;
  playerColor: string;
  correctCount: number;
  wrongCount: number;
  turnLabel?: string;
  headerExtra?: React.ReactNode;
}

export default function RoscoPlayer({
  letters,
  progress,
  currentIndex,
  finished,
  endsAt,
  onSubmitAnswer,
  onPass,
  doneMessage = '¡Has terminado tu rosco! Esperando a los demás...',
  playerName,
  playerAvatar,
  playerColor,
  correctCount,
  wrongCount,
  turnLabel,
  headerExtra,
}: RoscoPlayerProps) {
  const [answerText, setAnswerText] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pendingIndexRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpokenIndexRef = useRef<number | null>(null);

  const tts = useSpeechSynthesis();
  const speech = useSpeechRecognition((text) => setAnswerText(text));

  const currentLetter = letters[currentIndex] ?? null;

  useEffect(() => {
    if (pendingIndexRef.current === null) return;
    const resolved = progress[pendingIndexRef.current];
    if (resolved?.state === 'correct' || resolved?.state === 'wrong') {
      setFlash(resolved.state);
      pendingIndexRef.current = null;
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlash(null), 900);
    }
  }, [progress]);

  useEffect(() => {
    if (!currentLetter || finished) return;
    if (lastSpokenIndexRef.current === currentIndex) return;
    lastSpokenIndexRef.current = currentIndex;
    speech.stop();
    if (tts.supported && tts.autoRead) {
      tts.speak(currentLetter.clue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, finished]);

  if (!currentLetter) return null;

  function submit() {
    if (!answerText.trim() || finished) return;
    speech.stop();
    pendingIndexRef.current = currentIndex;
    onSubmitAnswer(answerText.trim());
    setAnswerText('');
  }

  function pass() {
    if (finished) return;
    speech.stop();
    onPass();
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
    } else {
      tts.stop();
      setAnswerText('');
      speech.start();
    }
  }

  return (
    <div className="player-game">
      <div className="game-status-bar">
        <div className="status-player">
          <AvatarView avatar={playerAvatar} color={playerColor} size={36} />
          <div className="status-player-info">
            {turnLabel && <span className="status-turn-label">{turnLabel}</span>}
            <span className="status-player-name">{playerName}</span>
          </div>
        </div>
        <div className="status-stats">
          <span className="status-stat status-stat-correct">✔{correctCount}</span>
          <span className="status-stat status-stat-wrong">✘{wrongCount}</span>
        </div>
        <Timer endsAt={endsAt} compact />
      </div>

      {headerExtra}

      <div className="rosco-wheel-wrap">
        <RoscoWheel letters={letters} progress={progress} avatar={playerAvatar} color={playerColor} size={360} />
      </div>

      {finished ? (
        <p className="app-subtitle game-done-message">{doneMessage}</p>
      ) : (
        <>
          <div
            className={`clue-card ${flash === 'correct' ? 'clue-card-correct' : ''} ${
              flash === 'wrong' ? 'clue-card-wrong' : ''
            }`}
          >
            <div className="clue-card-top">
              <span className="clue-letter">{currentLetter.letter}</span>
              <p className="clue-text">{currentLetter.clue}</p>
              <div className="clue-card-actions">
                {tts.supported && (
                  <button
                    type="button"
                    className={`btn-icon-flat ${tts.speaking ? 'btn-icon-flat-active' : ''}`}
                    onClick={() => (tts.speaking ? tts.stop() : tts.speak(currentLetter.clue))}
                    aria-label="Escuchar pista"
                    title="Escuchar pista"
                  >
                    {tts.speaking ? '⏸️' : '🔊'}
                  </button>
                )}
                {tts.supported && (
                  <button
                    type="button"
                    className={`btn-icon-flat ${settingsOpen ? 'btn-icon-flat-active' : ''}`}
                    onClick={() => setSettingsOpen((v) => !v)}
                    aria-label="Ajustes de voz"
                    title="Ajustes de voz"
                  >
                    ⚙️
                  </button>
                )}
              </div>
            </div>

            {settingsOpen && (
              <div className="tts-popover">
                <label className="tts-rate-label">
                  Velocidad: {tts.rate.toFixed(2)}x
                  <input
                    type="range"
                    min={tts.MIN_RATE}
                    max={tts.MAX_RATE}
                    step={0.25}
                    value={tts.rate}
                    onChange={(e) => tts.setRate(Number(e.target.value))}
                  />
                </label>
                <label className="tts-auto-label">
                  <input
                    type="checkbox"
                    checked={tts.autoRead}
                    onChange={(e) => tts.setAutoRead(e.target.checked)}
                  />
                  Leer pistas automáticamente
                </label>
                {tts.silentWarning && (
                  <p className="tts-warning">
                    No se ha oído el audio. Prueba a bajar "Shields" en Brave, usar Chrome, o jugar
                    desde el móvil.
                  </p>
                )}
              </div>
            )}
          </div>

          <form
            className="answer-form-compact"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="answer-input-row">
              <input
                type="text"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={speech.listening ? 'Escuchando...' : 'Tu respuesta...'}
                autoFocus
                autoComplete="off"
              />
              {speech.supported && (
                <button
                  type="button"
                  className={`mic-button ${speech.listening ? 'mic-button-active' : ''}`}
                  onClick={toggleMic}
                  aria-label="Responder por voz"
                  title="Responder por voz"
                >
                  🎤
                </button>
              )}
            </div>
            <div className="answer-buttons">
              <button className="btn btn-secondary" type="button" onClick={pass}>
                ⏭️ Pasapalabra
              </button>
              <button className="btn btn-primary" type="submit" disabled={!answerText.trim()}>
                ✅ Responder
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
