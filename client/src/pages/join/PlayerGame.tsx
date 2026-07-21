import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoscoPlayer from '../../components/RoscoPlayer';
import AvatarView from '../../components/AvatarView';
import { useGame } from '../../context/GameContext';
import { getSocket } from '../../socket';
import { rankPlayers } from '../../utils/rank';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { loadSession } from '../../utils/session';

interface OutcomeEvent {
  seq: number;
  playerName: string;
  correctCount: number;
  result: 'correct' | 'wrong' | 'passed';
  correctAnswer: string | null;
}

export default function PlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, emitWithAck, setPlayerId } = useGame();
  const [outcomeEvent, setOutcomeEvent] = useState<OutcomeEvent | null>(null);
  const seqRef = useRef(0);

  const player = room?.players.find((p) => p.id === playerId);

  useRoomReconnect({
    code,
    prefix: 'rosco',
    hostReconnectEvent: 'host:reconnect',
    playerReconnectEvent: 'player:reconnect',
    emitWithAck,
    setPlayerId,
    onPlayerReconnectFailed: () => navigate(`/join/${code}`),
  });

  useEffect(() => {
    if (playerId || !code) return;
    // Si hay una sesión guardada, useRoomReconnect intentará recuperarla; solo si no hay
    // nada que recuperar mandamos directamente a la pantalla de unirse.
    const session = loadSession('rosco', code);
    if (!session?.playerId) {
      navigate(`/join/${code}`);
    }
  }, [playerId, code, navigate]);

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
              <AvatarView avatar={r.avatar} color={r.color} size={32} />
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

  const isMyTurn = room.activePlayerId === player.id;
  const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
  const otherPlayers = room.players.filter((p) => p.id !== player.id);

  function submitAnswer(answerText: string) {
    getSocket().emit(
      'player:submitAnswer',
      { code, answerText },
      (res: { correct: boolean; correctAnswer: string | null }) => {
        seqRef.current += 1;
        setOutcomeEvent({
          seq: seqRef.current,
          playerName: player!.name,
          correctCount: res.correct ? player!.correctCount + 1 : player!.correctCount,
          result: res.correct ? 'correct' : 'wrong',
          correctAnswer: res.correctAnswer,
        });
      },
    );
  }

  function pass() {
    getSocket().emit('player:pass', { code });
    seqRef.current += 1;
    setOutcomeEvent({
      seq: seqRef.current,
      playerName: player!.name,
      correctCount: player!.correctCount,
      result: 'passed',
      correctAnswer: null,
    });
  }

  return (
    <RoscoPlayer
      letters={player.rosco.letters}
      progress={player.progress}
      currentIndex={player.currentIndex}
      finished={Boolean(player.finishedAt)}
      canAct={isMyTurn}
      endsAt={room.endsAt}
      onSubmitAnswer={submitAnswer}
      onPass={pass}
      playerName={player.name}
      playerAvatar={player.avatar}
      playerColor={player.color}
      correctCount={player.correctCount}
      wrongCount={player.wrongCount}
      turnLabel={isMyTurn ? '¡Tu turno!' : undefined}
      waitingMessage={!isMyTurn && activePlayer ? `Turno de ${activePlayer.name}...` : 'Esperando turno...'}
      activePlayerName={activePlayer?.name ?? null}
      outcomeEvent={outcomeEvent}
      spectateTarget={
        !isMyTurn && activePlayer
          ? {
              name: activePlayer.name,
              avatar: activePlayer.avatar,
              color: activePlayer.color,
              letters: activePlayer.rosco.letters,
              progress: activePlayer.progress,
              currentIndex: activePlayer.currentIndex,
              correctCount: activePlayer.correctCount,
              wrongCount: activePlayer.wrongCount,
            }
          : null
      }
      headerExtra={
        otherPlayers.length > 0 ? (
          <div className="mini-scoreboard">
            {otherPlayers.map((p) => (
              <div
                key={p.id}
                className={`mini-scoreboard-chip ${p.id === room.activePlayerId ? 'mini-scoreboard-chip-active' : ''} ${
                  p.finishedAt ? 'mini-scoreboard-chip-done' : ''
                }`}
                title={`${p.name}: ${p.correctCount} aciertos, ${p.wrongCount} fallos`}
              >
                <AvatarView avatar={p.avatar} color={p.color} size={24} />
                <span>
                  {p.correctCount}✔ {p.wrongCount}✘
                </span>
              </div>
            ))}
          </div>
        ) : null
      }
    />
  );
}
