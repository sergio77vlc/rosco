import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoscoWheel from '../../components/RoscoWheel';
import Timer from '../../components/Timer';
import { useGame } from '../../context/GameContext';
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

  if (!room || !player || !code) {
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

  const currentLetter = room.rosco.letters[player.currentIndex];
  const finished = Boolean(player.finishedAt);

  function submit() {
    if (!answerText.trim() || finished) return;
    pendingIndexRef.current = player!.currentIndex;
    getSocket().emit('player:submitAnswer', { code, answerText: answerText.trim() });
    setAnswerText('');
  }

  function pass() {
    if (finished) return;
    getSocket().emit('player:pass', { code });
  }

  return (
    <div className="screen screen-center player-game">
      <Timer endsAt={room.endsAt} />
      <RoscoWheel letters={room.rosco.letters} progress={player.progress} size={280} />

      {finished ? (
        <p className="app-subtitle">¡Has terminado tu rosco! Esperando a los demás...</p>
      ) : (
        <>
          <div className={`clue-card ${flash === 'correct' ? 'clue-card-correct' : ''} ${flash === 'wrong' ? 'clue-card-wrong' : ''}`}>
            <span className="clue-letter">{currentLetter.letter}</span>
            <p className="clue-text">{currentLetter.clue}</p>
          </div>
          <form
            className="answer-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              type="text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Tu respuesta..."
              autoFocus
              autoComplete="off"
            />
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
