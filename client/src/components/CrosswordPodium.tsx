import React from 'react';
import type { CrosswordRankingEntry } from '@rosco/shared';
import AvatarView from './AvatarView';

interface CrosswordPodiumProps {
  ranking: CrosswordRankingEntry[];
  highlightPlayerId?: string | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CrosswordPodium({ ranking, highlightPlayerId }: CrosswordPodiumProps) {
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  // Orden visual del podio: 2º a la izquierda, 1º en el centro (más alto), 3º a la derecha.
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as CrosswordRankingEntry[];

  return (
    <div className="quiz-podium-wrap">
      <div className="quiz-podium">
        {order.map((r) => (
          <div key={r.playerId} className={`quiz-podium-step quiz-podium-step-${r.place}`}>
            <span className="quiz-podium-medal">{MEDALS[r.place - 1]}</span>
            <AvatarView avatar={r.avatar} color={r.color} size={r.place === 1 ? 64 : 48} />
            <span className="quiz-podium-name">{r.name}</span>
            <span className="quiz-podium-score">{r.score} pts</span>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="ranking-list">
          {rest.map((r) => (
            <div key={r.playerId} className={`ranking-row ${r.playerId === highlightPlayerId ? 'ranking-row-me' : ''}`}>
              <span className="ranking-medal">#{r.place}</span>
              <AvatarView avatar={r.avatar} color={r.color} size={32} />
              <span className="ranking-name">{r.name}</span>
              <span className="ranking-score">{r.score} pts · {r.wordsSolved} palabras</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
