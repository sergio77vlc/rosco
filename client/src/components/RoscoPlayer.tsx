import React, { useEffect, useRef, useState } from 'react';
import type { LetterClue, PlayerProgressEntry } from '@rosco/shared';
import RoscoWheel from './RoscoWheel';
import Timer from './Timer';
import AvatarView from './AvatarView';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const CORRECT_PHRASES = ['¡Correcto!', '¡Sí!', '¡Bien!'];
const WRONG_PHRASES = ['No', 'Error'];
const CORRECT_MILESTONE_STEP = 5;

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

interface OutcomeEvent {
  seq: number;
  playerName: string;
  correctCount: number;
  result: 'correct' | 'wrong' | 'passed';
}

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
  canAct?: boolean;
  waitingMessage?: string;
  /** Nombre del jugador que tiene el turno ahora mismo, para narrar los cambios de turno. */
  activePlayerName?: string | null;
  /**
   * Último acierto/fallo/pasapalabra resuelto, cuando el padre puede proporcionarlo de forma
   * explícita (p. ej. el modo local, donde este componente se remonta al cambiar el turno y no
   * llegaría a ver por sí solo la resolución de su propia respuesta). Si no se pasa (modo en
   * red, donde el componente nunca se remonta), se detecta internamente a partir de `progress`.
   */
  outcomeEvent?: OutcomeEvent | null;
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
  canAct = true,
  waitingMessage = 'Esperando turno...',
  activePlayerName = null,
  outcomeEvent,
}: RoscoPlayerProps) {
  const [answerText, setAnswerText] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pendingIndexRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpokenIndexRef = useRef<number | null>(null);
  const lastActiveNameRef = useRef<string | null>(null);
  const lastHandledEventSeqRef = useRef<number | null>(null);

  const tts = useSpeechSynthesis();
  const speech = useSpeechRecognition((text) => setAnswerText(text));

  const currentLetter = letters[currentIndex] ?? null;

  function pushOutcomePhrases(phrases: string[], result: 'correct' | 'wrong' | 'passed', forCorrectCount: number, forName: string) {
    if (!tts.narrate) return;
    if (result === 'correct') {
      phrases.push(pickRandom(CORRECT_PHRASES));
      if (forCorrectCount > 0 && forCorrectCount % CORRECT_MILESTONE_STEP === 0) {
        phrases.push(`¡Qué bien va ${forName}!`);
      }
    } else if (result === 'wrong') {
      phrases.push(pickRandom(WRONG_PHRASES));
    } else {
      phrases.push('Pasapalabra');
    }
  }

  // Encadena en un único efecto la narración del resultado (acierto/fallo/pasapalabra),
  // el aviso de cambio de turno y la lectura automática de la siguiente pista, para que
  // se hablen en orden en vez de interrumpirse entre sí.
  useEffect(() => {
    const phrases: string[] = [];

    if (outcomeEvent !== undefined) {
      // El padre indica explícitamente el resultado (modo local: este componente se
      // remonta al cambiar el turno, así que no puede detectarlo por sí solo).
      if (outcomeEvent && outcomeEvent.seq !== lastHandledEventSeqRef.current) {
        lastHandledEventSeqRef.current = outcomeEvent.seq;
        if (outcomeEvent.playerName === playerName && (outcomeEvent.result === 'correct' || outcomeEvent.result === 'wrong')) {
          setFlash(outcomeEvent.result);
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          flashTimeoutRef.current = setTimeout(() => setFlash(null), 900);
        }
        pushOutcomePhrases(phrases, outcomeEvent.result, outcomeEvent.correctCount, outcomeEvent.playerName);
      }
    } else if (pendingIndexRef.current !== null) {
      // Modo en red: este componente nunca se remonta, así que detecta el resultado
      // comparando el índice pendiente con el progreso recibido.
      const resolved = progress[pendingIndexRef.current];
      if (resolved?.state === 'correct' || resolved?.state === 'wrong' || resolved?.state === 'passed') {
        pendingIndexRef.current = null;
        if (resolved.state === 'correct' || resolved.state === 'wrong') {
          setFlash(resolved.state);
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          flashTimeoutRef.current = setTimeout(() => setFlash(null), 900);
        }
        pushOutcomePhrases(phrases, resolved.state, correctCount, playerName);
      }
    }

    if (activePlayerName && activePlayerName !== lastActiveNameRef.current) {
      lastActiveNameRef.current = activePlayerName;
      if (tts.narrate) phrases.push(`Turno de ${activePlayerName}`);
    }

    if (currentLetter && !finished && canAct && lastSpokenIndexRef.current !== currentIndex) {
      lastSpokenIndexRef.current = currentIndex;
      if (tts.autoRead) phrases.push(currentLetter.clue);
    }

    if (phrases.length > 0 && tts.supported) {
      speech.stop();
      phrases.forEach((phrase, i) => tts.speak(phrase, { interrupt: i === 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, currentIndex, canAct, finished, activePlayerName, outcomeEvent]);

  if (!currentLetter) return null;

  function submit() {
    if (!answerText.trim() || finished || !canAct) return;
    speech.stop();
    pendingIndexRef.current = currentIndex;
    onSubmitAnswer(answerText.trim());
    setAnswerText('');
  }

  function pass() {
    if (finished || !canAct) return;
    speech.stop();
    pendingIndexRef.current = currentIndex;
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
                <label className="tts-auto-label">
                  <input
                    type="checkbox"
                    checked={tts.narrate}
                    onChange={(e) => tts.setNarrate(e.target.checked)}
                  />
                  Narración (aciertos, fallos y turnos)
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

          {canAct ? (
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
          ) : (
            <div className="answer-form-compact answer-form-waiting">
              <p className="waiting-turn-message">⏳ {waitingMessage}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
