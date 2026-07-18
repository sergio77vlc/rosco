import React from 'react';
import type { RoomPublic } from '@rosco/shared';
import RoscoWheel from '../../components/RoscoWheel';
import Timer from '../../components/Timer';
import PlayerBadge from '../../components/PlayerBadge';
import { rankPlayers } from '../../utils/rank';

interface HostGameProps {
  room: RoomPublic;
}

export default function HostGame({ room }: HostGameProps) {
  const ranking = rankPlayers(room.players);
  const rankByPlayerId = new Map(ranking.map((r) => [r.playerId, r.rank]));

  return (
    <div className="screen">
      <div className="host-game-header">
        <h1 className="screen-title">{room.rosco.title}</h1>
        <Timer endsAt={room.endsAt} large />
      </div>

      <div className="host-wheel-grid">
        {room.players.map((p) => (
          <div key={p.id} className="host-wheel-cell">
            <div className="host-wheel-cell-header">
              <PlayerBadge
                name={p.name}
                color={p.color}
                connected={p.connected}
                subtitle={`#${rankByPlayerId.get(p.id)} · ${p.correctCount} aciertos · ${p.wrongCount} fallos`}
              />
              {p.finishedAt && <span className="badge-done">TERMINADO</span>}
            </div>
            <RoscoWheel letters={room.rosco.letters} progress={p.progress} size={240} />
          </div>
        ))}
      </div>
    </div>
  );
}
