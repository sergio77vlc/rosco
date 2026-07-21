import React from 'react';
import type { QuizPlayerPublic } from '@rosco/shared';
import AvatarView from './AvatarView';

interface QuizLiveRankingProps {
  players: QuizPlayerPublic[];
  highlightPlayerId?: string | null;
  compact?: boolean;
}

export default function QuizLiveRanking({ players, highlightPlayerId, compact }: QuizLiveRankingProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`quiz-live-ranking ${compact ? 'quiz-live-ranking-compact' : ''}`}>
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`quiz-live-ranking-row ${p.id === highlightPlayerId ? 'quiz-live-ranking-row-self' : ''}`}
        >
          <span className="quiz-live-ranking-rank">{i + 1}</span>
          <AvatarView avatar={p.avatar} color={p.color} size={compact ? 22 : 28} />
          <span className="quiz-live-ranking-name">{p.name}</span>
          {p.lastPointsEarned !== null && p.lastPointsEarned > 0 && (
            <span className="quiz-live-ranking-delta">+{p.lastPointsEarned}</span>
          )}
          <span className="quiz-live-ranking-score">{p.score}</span>
        </div>
      ))}
    </div>
  );
}
