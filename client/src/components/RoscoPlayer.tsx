import React, { useEffect, useRef, useState } from 'react';
import type { LetterClue, PlayerProgressEntry } from '@rosco/shared';
import RoscoWheel from './RoscoWheel';
import Timer from './Timer';
import AvatarView from './AvatarView';
import Presenter, { type PresenterExpression } from './Presenter';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const PRESENTER_EXPRESSION_HOLD_MS = 1800;

const CORRECT_PHRASES = ['¡Correcto!', '¡Sí!', '¡Bien!'];
const WRONG_PHRASES = ['No', 'Error'];
const HURRY_PHRASES = ['¡Vamos, contesta!', '¡Rápido!', '¡Que se acaba el tiempo!', '¡Venga, responde!', '¡No te lo pienses tanto!'];
const CORRECT_MILESTONE_STEP = 5;
const HURRY_DELAY_MS = 10_000;
const HURRY_REPEAT_MS = 8_000;
const REVEAL_DURATION_MS = 4_500;

/** Nombres fonéticos de las letras, para que el TTS las pronuncie bien (evita que diga "y griega" como "y" = "and"). */
const LETTER_NAMES: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'efe', G: 'ge', H: 'hache', I: 'i', J: 'jota',
  L: 'ele', M: 'eme', N: 'ene', Ñ: 'eñe', O: 'o', P: 'pe', Q: 'cu', R: 'erre', S: 'ese', T: 'te',
  U: 'u', V: 'uve', X: 'equis', Y: 'i griega', Z: 'zeta',
};

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function ruleLabel(letter: string, matchType: 'starts' | 'contains', spoken: boolean): string {
  const prefix = matchType === 'starts' ? 'Empieza por la' : 'Contiene la';
  const letterText = spoken ? LETTER_NAMES[letter] ?? letter : letter;
  return `${prefix} ${letterText}`;
}

interface OutcomeEvent {
  seq: number;
  playerName: string;
  correctCount: number;
  result: 'correct' | 'wrong' | 'passed';
  correctAnswer: string | null;
}

interface SpectateTarget {
  name: string;
  avatar: string;
  color: string;
  letters: Omit<LetterClue, 'answer'>[];
  progress: PlayerProgressEntry[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
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
   * Último acierto/fallo/pasapalabra resuelto, proporcionado por el padre (que es quien conoce
   * el resultado real: el servidor en modo red, el reducer en modo local). Este componente no
   * lo detecta por sí solo para evitar carreras entre el ack de red y la difusión de estado.
   */
  outcomeEvent: OutcomeEvent | null;
  /**
   * Cuando no es el turno de este jugador, qué rosco mostrar en su lugar (el del jugador activo),
   * en modo espectador: no debe ser posible ver la propia pregunta pendiente mientras se espera.
   */
  spectateTarget?: SpectateTarget | null;
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
  spectateTarget = null,
}: RoscoPlayerProps) {
  const [answerText, setAnswerText] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [turnReady, setTurnReady] = useState(false);
  const [presenterExpression, setPresenterExpression] = useState<PresenterExpression>('neutral');
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenterExpressionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpokenIndexRef = useRef<number | null>(null);
  const lastActiveNameRef = useRef<string | null>(null);
  const lastHandledEventSeqRef = useRef<number | null>(null);
  const hurryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tts = useSpeechSynthesis();
  const speech = useSpeechRecognition((text) => setAnswerText(text));

  const currentLetter = letters[currentIndex] ?? null;

  function pushOutcomePhrases(
    phrases: string[],
    result: 'correct' | 'wrong' | 'passed',
    forCorrectCount: number,
    forName: string,
    correctAnswer: string | null,
  ) {
    if (!tts.narrate) return;
    if (result === 'correct') {
      phrases.push(pickRandom(CORRECT_PHRASES));
      if (forCorrectCount > 0 && forCorrectCount % CORRECT_MILESTONE_STEP === 0) {
        phrases.push(`¡Qué bien va ${forName}!`);
      }
    } else if (result === 'wrong') {
      phrases.push(pickRandom(WRONG_PHRASES));
      if (correctAnswer) phrases.push(`La respuesta correcta es ${correctAnswer}`);
    } else {
      phrases.push('Pasapalabra');
    }
  }

  // Encadena en un único efecto la narración del resultado (acierto/fallo/pasapalabra),
  // el aviso de cambio de turno y la lectura automática de la siguiente pista (con la regla
  // de la letra por delante), para que se hablen en orden en vez de interrumpirse entre sí.
  useEffect(() => {
    const phrases: string[] = [];

    if (outcomeEvent && outcomeEvent.seq !== lastHandledEventSeqRef.current) {
      lastHandledEventSeqRef.current = outcomeEvent.seq;
      if (outcomeEvent.playerName === playerName && (outcomeEvent.result === 'correct' || outcomeEvent.result === 'wrong')) {
        setFlash(outcomeEvent.result);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setFlash(null), 900);
        setPresenterExpression(outcomeEvent.result === 'correct' ? 'happy' : 'sad');
        if (presenterExpressionTimeoutRef.current) clearTimeout(presenterExpressionTimeoutRef.current);
        presenterExpressionTimeoutRef.current = setTimeout(() => setPresenterExpression('neutral'), PRESENTER_EXPRESSION_HOLD_MS);
      }
      if (outcomeEvent.result === 'wrong' && outcomeEvent.correctAnswer) {
        setRevealedAnswer(outcomeEvent.correctAnswer);
        if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = setTimeout(() => setRevealedAnswer(null), REVEAL_DURATION_MS);
      }
      pushOutcomePhrases(phrases, outcomeEvent.result, outcomeEvent.correctCount, outcomeEvent.playerName, outcomeEvent.correctAnswer);
    }

    if (activePlayerName && activePlayerName !== lastActiveNameRef.current) {
      lastActiveNameRef.current = activePlayerName;
      if (tts.narrate) phrases.push(`Turno de ${activePlayerName}`);
    }

    if (currentLetter && !finished && canAct && turnReady && lastSpokenIndexRef.current !== currentIndex) {
      lastSpokenIndexRef.current = currentIndex;
      if (tts.autoRead) {
        phrases.push(ruleLabel(currentLetter.letter, currentLetter.matchType, true));
        phrases.push(currentLetter.clue);
      }
    }

    if (phrases.length > 0 && tts.supported) {
      speech.stop();
      phrases.forEach((phrase, i) => tts.speak(phrase, { interrupt: i === 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, currentIndex, canAct, finished, activePlayerName, outcomeEvent, turnReady]);

  // Entre turno y turno hacemos una pausa: no se revela la pregunta hasta que el jugador al
  // que le toca pulsa el botón de la pantalla de "listo". Si el turno sigue en la misma
  // persona (acierto que conserva turno) no hace falta pausar de nuevo.
  useEffect(() => {
    setTurnReady(false);
  }, [activePlayerName]);

  // Si pasan más de 10s sin que este jugador responda a la misma letra, el presentador mete
  // prisa con frases rápidas, repitiendo cada pocos segundos hasta que conteste o pase.
  useEffect(() => {
    if (!canAct || !turnReady || finished || !currentLetter) return;
    if (!tts.supported) return;
    const nudge = () => {
      if (tts.narrate) tts.speak(pickRandom(HURRY_PHRASES), { interrupt: false });
    };
    const timeout = setTimeout(() => {
      nudge();
      hurryIntervalRef.current = setInterval(nudge, HURRY_REPEAT_MS);
    }, HURRY_DELAY_MS);
    return () => {
      clearTimeout(timeout);
      if (hurryIntervalRef.current) {
        clearInterval(hurryIntervalRef.current);
        hurryIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, canAct, finished, turnReady]);

  if (!currentLetter) return null;

  function submit() {
    if (!answerText.trim() || finished || !canAct) return;
    speech.stop();
    onSubmitAnswer(answerText.trim());
    setAnswerText('');
  }

  function pass() {
    if (finished || !canAct) return;
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

  function speakClue(letterEntry: Omit<LetterClue, 'answer'>) {
    tts.speak(ruleLabel(letterEntry.letter, letterEntry.matchType, true), { interrupt: true });
    tts.speak(letterEntry.clue, { interrupt: false });
  }

  const spectateLetter = spectateTarget ? spectateTarget.letters[spectateTarget.currentIndex] ?? null : null;

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

      {revealedAnswer && (
        <div className="answer-reveal-toast">
          ❌ La respuesta correcta era: <strong>{revealedAnswer}</strong>
        </div>
      )}

      {canAct && !turnReady && !finished ? (
        <div className="turn-gate">
          <Presenter expression={presenterExpression} speaking={tts.speaking} size={200} className="turn-gate-presenter" />
          <AvatarView avatar={playerAvatar} color={playerColor} size={64} />
          <h2 className="turn-gate-title">¡Tu turno, {playerName}!</h2>
          <p className="turn-gate-hint">Toca cuando estés listo para ver tu pregunta.</p>
          <button type="button" className="btn btn-primary btn-big turn-gate-button" onClick={() => setTurnReady(true)}>
            ▶️ ¡Empezar!
          </button>
        </div>
      ) : canAct ? (
        <>
          <div className="rosco-wheel-wrap">
            <RoscoWheel letters={letters} progress={progress} avatar={playerAvatar} color={playerColor} size={360} />
            <Presenter
              expression={presenterExpression}
              speaking={tts.speaking}
              size={100}
              className="inline-presenter"
            />
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
                  <span className="clue-letter-big">{currentLetter.letter}</span>
                  <div className="clue-rule-and-text">
                    <span className="clue-rule-badge">{ruleLabel(currentLetter.letter, currentLetter.matchType, false)}</span>
                    <p className="clue-text">{currentLetter.clue}</p>
                  </div>
                  <div className="clue-card-actions">
                    {tts.supported && (
                      <button
                        type="button"
                        className={`btn-icon-flat ${tts.speaking ? 'btn-icon-flat-active' : ''}`}
                        onClick={() => (tts.speaking ? tts.stop() : speakClue(currentLetter))}
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
        </>
      ) : spectateTarget ? (
        <>
          <p className="spectator-banner">👀 Viendo la partida de {spectateTarget.name}</p>
          <div className="rosco-wheel-wrap">
            <RoscoWheel
              letters={spectateTarget.letters}
              progress={spectateTarget.progress}
              avatar={spectateTarget.avatar}
              color={spectateTarget.color}
              size={340}
            />
            <Presenter expression="neutral" speaking={tts.speaking} size={100} className="inline-presenter" />
          </div>
          {spectateLetter && (
            <div className="clue-card clue-card-spectator">
              <div className="clue-card-top">
                <span className="clue-letter-big">{spectateLetter.letter}</span>
                <div className="clue-rule-and-text">
                  <span className="clue-rule-badge">{ruleLabel(spectateLetter.letter, spectateLetter.matchType, false)}</span>
                  <p className="clue-text">{spectateLetter.clue}</p>
                </div>
              </div>
            </div>
          )}
          <div className="answer-form-compact answer-form-waiting">
            <p className="waiting-turn-message">⏳ {waitingMessage}</p>
          </div>
        </>
      ) : finished ? (
        <p className="app-subtitle game-done-message">{doneMessage}</p>
      ) : (
        <div className="answer-form-compact answer-form-waiting">
          <p className="waiting-turn-message">⏳ {waitingMessage}</p>
        </div>
      )}
    </div>
  );
}
