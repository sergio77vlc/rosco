import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { RoomPublic } from '@rosco/shared';
import AvatarView from '../../components/AvatarView';
import { rankPlayers } from '../../utils/rank';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../../constants';

interface HostResultsProps {
  room: RoomPublic;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function HostResults({ room }: HostResultsProps) {
  const navigate = useNavigate();
  const ranking = rankPlayers(room.players);
  const themeInfo = categoryInfo(room.roscoTheme);

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Resultados</h1>
      <h2 className="app-subtitle">
        {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[room.roscoDifficulty]} {DIFFICULTY_LABELS[room.roscoDifficulty]}
      </h2>

      <div className="ranking-list">
        {ranking.map((r) => (
          <div key={r.playerId} className="ranking-row">
            <span className="ranking-medal">{MEDALS[r.rank - 1] ?? `#${r.rank}`}</span>
            <AvatarView avatar={r.avatar} color={r.color} size={32} />
            <span className="ranking-name">{r.name}</span>
            <span className="ranking-score">
              {r.correctCount} aciertos · {r.wrongCount} fallos
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-big" onClick={() => navigate('/host')}>
        🔁 Nueva partida
      </button>
    </div>
  );
}
