import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoscoPlayer from '../../components/RoscoPlayer';
import AvatarView from '../../components/AvatarView';
import { useGame } from '../../context/GameContext';
import { getSocket } from '../../socket';
import { rankPlayers } from '../../utils/rank';

export default function PlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId } = useGame();

  const player = room?.players.find((p) => p.id === playerId);

  useEffect(() => {
    if (!playerId) {
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

  return (
    <RoscoPlayer
      letters={room.rosco.letters}
      progress={player.progress}
      currentIndex={player.currentIndex}
      finished={Boolean(player.finishedAt)}
      endsAt={room.endsAt}
      onSubmitAnswer={(answerText) => getSocket().emit('player:submitAnswer', { code, answerText })}
      onPass={() => getSocket().emit('player:pass', { code })}
      playerName={player.name}
      playerAvatar={player.avatar}
      playerColor={player.color}
      correctCount={player.correctCount}
      wrongCount={player.wrongCount}
    />
  );
}
