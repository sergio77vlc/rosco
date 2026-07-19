import React from 'react';
import type { RoomPublic } from '@rosco/shared';
import RoscoWheel from '../../components/RoscoWheel';
import Timer from '../../components/Timer';
import PlayerBadge from '../../components/PlayerBadge';
import { rankPlayers } from '../../utils/rank';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../../constants';

interface HostGameProps {
  room: RoomPublic;
}

export default function HostGame({ room }: HostGameProps) {
  const ranking = rankPlayers(room.players);
  const rankByPlayerId = new Map(ranking.map((r) => [r.playerId, r.rank]));
  const themeInfo = categoryInfo(room.roscoTheme);

  return (
    <div className="screen">
      <div className="host-game-header">
        <h1 className="screen-title">
          {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[room.roscoDifficulty]}{' '}
          {DIFFICULTY_LABELS[room.roscoDifficulty]}
        </h1>
        <Timer endsAt={room.endsAt} large />
      </div>

      <div className="host-wheel-grid">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`host-wheel-cell ${p.id === room.activePlayerId ? 'host-wheel-cell-active' : ''}`}
          >
            <div className="host-wheel-cell-header">
              <PlayerBadge
                name={p.name}
                color={p.color}
                avatar={p.avatar}
                connected={p.connected}
                subtitle={`#${rankByPlayerId.get(p.id)} · ${p.correctCount} aciertos · ${p.wrongCount} fallos`}
              />
              {p.finishedAt ? (
                <span className="badge-done">TERMINADO</span>
              ) : p.id === room.activePlayerId ? (
                <span className="badge-turn">SU TURNO</span>
              ) : null}
            </div>
            <RoscoWheel letters={p.rosco.letters} progress={p.progress} avatar={p.avatar} color={p.color} size={240} />
          </div>
        ))}
      </div>
    </div>
  );
}
