import React from 'react';
import type { BattleRankingEntry } from '@rosco/shared';
import MiiAvatar from './MiiAvatar';

interface BattlePodiumProps {
  ranking: BattleRankingEntry[];
  highlightPlayerId?: string | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function BattlePodium({ ranking, highlightPlayerId }: BattlePodiumProps) {
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as BattleRankingEntry[];

  return (
    <div className="quiz-podium-wrap">
      <div className="quiz-podium">
        {order.map((r) => (
          <div key={r.playerId} className={`quiz-podium-step quiz-podium-step-${r.place}`}>
            <span className="quiz-podium-medal">{MEDALS[r.place - 1]}</span>
            <MiiAvatar mii={r.mii} size={r.place === 1 ? 84 : 66} />
            <span className="quiz-podium-name">{r.name}</span>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="ranking-list">
          {rest.map((r) => (
            <div key={r.playerId} className={`ranking-row ${r.playerId === highlightPlayerId ? 'ranking-row-me' : ''}`}>
              <span className="ranking-medal">#{r.place}</span>
              <MiiAvatar mii={r.mii} size={32} />
              <span className="ranking-name">{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
