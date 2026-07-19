import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoscoWheel from '../../components/RoscoWheel';
import Timer from '../../components/Timer';
import { useGame } from '../../context/GameContext';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { getSocket } from '../../socket';
import { rankPlayers } from '../../utils/rank';

export default function PlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId } = useGame();

  const [answerText, setAnswerText] = useState('');
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpokenIndexRef = useRef<number | null>(null);

  const tts = useSpeechSynthesis();
  const speech = useSpeechRecognition((text) => setAnswerText(text));

  const player = room?.players.find((p) => p.id === playerId);

  useEffect(() => {
    if (!playerId) {
      navigate(`/join/${code}`);
    }
  }, [playerId, code, navigate]);

  useEffect(() => {
    if (!player || pendingIndexRef.current === null) return;
    const resolved = player.progress[pendingIndexRef.current];
    if (resolved?.state === 'correct' || resolved?.state === 'wrong') {
      setFlash(resolved.state);
      pendingIndexRef.current = null;
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlash(null), 900);
    }
  }, [player]);

  const currentLetter = room && player ? room.rosco.letters[player.currentIndex] : null;
  const finished = Boolean(player?.finishedAt);

  useEffect(() => {
    if (!player || !currentLetter || finished) return;
    if (lastSpokenIndexRef.current === player.currentIndex) return;
    lastSpokenIndexRef.current = player.currentIndex;
    speech.stop();
    if (tts.supported && tts.autoRead) {
      tts.speak(currentLetter.clue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.currentIndex, finished]);

  if (!room || !player || !code || !currentLetter) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') {
    const ranking = rankPlayers(room.players);
    const myRank = ranking.find((r) => r.playerId === playerId);
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">¡Partida terminada!</h1>
        {myRank && (
          <p className="app-subtitle">
            Quedaste en el puesto #{myRank.rank} con {myRank.correctCount} aciertos y {myRank.wrongCount} fallos.
          </p>
        )}
        <div className="ranking-list">
          {ranking.map((r) => (
            <div key={r.playerId} className={`ranking-row ${r.playerId === playerId ? 'ranking-row-me' : ''}`}>
              <span className="ranking-medal">#{r.rank}</span>
              <span className="ranking-name">{r.name}</span>
              <span className="ranking-score">
                {r.correctCount} aciertos · {r.wrongCount} fallos
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function submit() {
    if (!answerText.trim() || finished) return;
    speech.stop();
    pendingIndexRef.current = player!.currentIndex;
    getSocket().emit('player:submitAnswer', { code, answerText: answerText.trim() });
    setAnswerText('');
  }

  function pass() {
    if (finished) return;
    speech.stop();
    getSocket().emit('player:pass', { code });
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
    <div className="screen screen-center player-game">
      <Timer endsAt={room.endsAt} />
      <RoscoWheel letters={room.rosco.letters} progress={player.progress} size={280} />

      {finished ? (
        <p className="app-subtitle">¡Has terminado tu rosco! Esperando a los demás...</p>
      ) : (
        <>
          <div
            className={`clue-card ${flash === 'correct' ? 'clue-card-correct' : ''} ${
              flash === 'wrong' ? 'clue-card-wrong' : ''
            }`}
          >
            <div className="clue-card-top">
              <span className="clue-letter">{currentLetter.letter}</span>
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
            </div>
            <p className="clue-text">{currentLetter.clue}</p>
          </div>

          {tts.supported && (
            <div className="tts-settings">
              <label className="tts-rate-label">
                Velocidad de lectura: {tts.rate.toFixed(2)}x
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
                  No se ha oído el audio. Tu navegador puede no tener voces de síntesis instaladas
                  (ocurre a veces en Brave/Linux) — prueba a bajar el nivel de "Shields" del sitio en
                  Brave, usar Chrome, o jugar desde el móvil.
                </p>
              )}
            </div>
          )}

          <form
            className="answer-form"
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
                Pasapalabra
              </button>
              <button className="btn btn-primary" type="submit" disabled={!answerText.trim()}>
                Responder
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
