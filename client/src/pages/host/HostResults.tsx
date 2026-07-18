import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { RoomPublic } from '@rosco/shared';
import { rankPlayers } from '../../utils/rank';

interface HostResultsProps {
  room: RoomPublic;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function HostResults({ room }: HostResultsProps) {
  const navigate = useNavigate();
  const ranking = rankPlayers(room.players);

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Resultados</h1>
      <h2 className="app-subtitle">{room.rosco.title}</h2>

      <div className="ranking-list">
        {ranking.map((r) => (
          <div key={r.playerId} className="ranking-row">
            <span className="ranking-medal">{MEDALS[r.rank - 1] ?? `#${r.rank}`}</span>
            <span className="ranking-name">{r.name}</span>
            <span className="ranking-score">
              {r.correctCount} aciertos · {r.wrongCount} fallos
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-big" onClick={() => navigate('/host')}>
        Nueva partida
      </button>
    </div>
  );
}
