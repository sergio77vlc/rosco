import React from 'react';
import type { QuizRoomPublic } from '@rosco/shared';
import Timer from '../../components/Timer';
import QuizLiveRanking from '../../components/QuizLiveRanking';
import { QUIZ_OPTION_STYLES } from '../../constants';

interface QuizHostGameProps {
  room: QuizRoomPublic;
}

export default function QuizHostGame({ room }: QuizHostGameProps) {
  const question = room.currentQuestion;
  const isReveal = room.status === 'reveal';
  const answeredCount = room.players.filter((p) => p.hasAnswered).length;

  return (
    <div className="screen screen-center quiz-host-screen">
      <div className="quiz-host-layout">
        <div className="quiz-host-main">
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
        </div>

        <div className="quiz-host-sidebar">
          <h2 className="quiz-leaderboard-title">🏆 Ranking en vivo</h2>
          <QuizLiveRanking players={room.players} />
        </div>
      </div>
    </div>
  );
}
