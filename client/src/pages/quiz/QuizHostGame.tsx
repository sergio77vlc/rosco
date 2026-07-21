import React from 'react';
import type { QuizRoomPublic } from '@rosco/shared';
import Timer from '../../components/Timer';
import AvatarView from '../../components/AvatarView';
import { QUIZ_OPTION_STYLES } from '../../constants';

interface QuizHostGameProps {
  room: QuizRoomPublic;
}

export default function QuizHostGame({ room }: QuizHostGameProps) {
  const question = room.currentQuestion;
  const isReveal = room.status === 'reveal';
  const answeredCount = room.players.filter((p) => p.hasAnswered).length;
  const leaderboard = [...room.players].sort((a, b) => b.score - a.score).slice(0, 6);

  return (
    <div className="screen screen-center quiz-host-screen">
      <div className="quiz-host-topbar">
        <span className="quiz-progress-badge">
          Pregunta {room.currentQuestionIndex + 1}/{room.questionCount}
        </span>
        <Timer endsAt={isReveal ? room.revealEndsAt : room.questionEndsAt} large />
      </div>

      {question && (
        <div className="quiz-question-card">
          <h1 className="quiz-question-text">{question.question}</h1>
          {!isReveal && <p className="quiz-answered-count">✋ {answeredCount}/{room.players.length} han respondido</p>}
        </div>
      )}

      <div className="quiz-options-grid quiz-options-grid-host">
        {question?.options.map((option, i) => {
          const style = QUIZ_OPTION_STYLES[i];
          const isCorrect = isReveal && room.revealCorrectIndex === i;
          const isDimmed = isReveal && room.revealCorrectIndex !== i;
          return (
            <div
              key={i}
              className={`quiz-option-tile ${isCorrect ? 'quiz-option-correct' : ''} ${isDimmed ? 'quiz-option-dimmed' : ''}`}
              style={{ backgroundColor: style.color }}
            >
              <span className="quiz-option-shape">{style.shape}</span>
              <span className="quiz-option-label">{option}</span>
              {isCorrect && <span className="quiz-option-check">✓</span>}
            </div>
          );
        })}
      </div>

      {isReveal && (
        <div className="quiz-leaderboard">
          <h2 className="quiz-leaderboard-title">🏆 Marcador</h2>
          {leaderboard.map((p, i) => (
            <div key={p.id} className="quiz-leaderboard-row">
              <span className="quiz-leaderboard-rank">{i + 1}</span>
              <AvatarView avatar={p.avatar} color={p.color} size={30} />
              <span className="quiz-leaderboard-name">{p.name}</span>
              {p.lastPointsEarned !== null && p.lastPointsEarned > 0 && (
                <span className="quiz-leaderboard-delta">+{p.lastPointsEarned}</span>
              )}
              <span className="quiz-leaderboard-score">{p.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
