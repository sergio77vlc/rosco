import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import Timer from '../../components/Timer';
import QuizPodium from '../../components/QuizPodium';
import QuizLiveRanking from '../../components/QuizLiveRanking';
import { fallbackQuizRanking } from '../../utils/quizRank';
import { QUIZ_OPTION_STYLES } from '../../constants';

export default function QuizPlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, ranking, emitWithAck } = useQuiz();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const player = room?.players.find((p) => p.id === playerId);

  useEffect(() => {
    if (!playerId) {
      navigate(`/quiz/join/${code}`);
    }
  }, [playerId, code, navigate]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [room?.currentQuestionIndex]);

  if (!room || !player || !code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') {
    const finalRanking = ranking ?? fallbackQuizRanking(room.players);
    const myRank = finalRanking.find((r) => r.playerId === playerId);
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">🏁 ¡Quiz terminado!</h1>
        {myRank && (
          <p className="app-subtitle">
            Quedaste en el puesto #{myRank.rank} con {myRank.score} puntos y {myRank.correctCount} aciertos.
          </p>
        )}
        <QuizPodium ranking={finalRanking} highlightPlayerId={playerId} />
      </div>
    );
  }

  if (room.status === 'lobby' || !room.currentQuestion) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Esperando la siguiente pregunta...</p>
      </div>
    );
  }

  const isReveal = room.status === 'reveal';
  const hasAnswered = player.hasAnswered;
  const question = room.currentQuestion;

  async function handleAnswer(optionIndex: 0 | 1 | 2 | 3) {
    if (hasAnswered || sending || isReveal) return;
    setSelectedIndex(optionIndex);
    setSending(true);
    try {
      await emitWithAck('quiz:playerAnswer', { code, optionIndex });
    } catch {
      setSelectedIndex(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="screen screen-center quiz-player-screen">
      <div className="quiz-player-topbar">
        <span className="quiz-progress-badge">
          Pregunta {room.currentQuestionIndex + 1}/{room.questionCount}
        </span>
        <span className="quiz-player-score">⭐ {player.score} pts</span>
        <Timer endsAt={isReveal ? room.revealEndsAt : room.questionEndsAt} compact />
      </div>

      <QuizLiveRanking players={room.players} highlightPlayerId={playerId} compact />

      <h1 className="quiz-question-text quiz-question-text-player">{question.question}</h1>

      {!isReveal && hasAnswered && (
        <p className="quiz-waiting-text">✅ Respuesta enviada. Esperando a los demás jugadores...</p>
      )}

      <div className="quiz-options-grid">
        {question.options.map((option, i) => {
          const style = QUIZ_OPTION_STYLES[i];
          const isMine = selectedIndex === i;
          const isCorrect = isReveal && room.revealCorrectIndex === i;
          const isWrongPick = isReveal && isMine && room.revealCorrectIndex !== i;
          const isDimmed = isReveal && !isCorrect && !isWrongPick;
          return (
            <button
              key={i}
              type="button"
              className={`quiz-option-tile quiz-option-tile-button ${isMine && !isReveal ? 'quiz-option-selected' : ''} ${isCorrect ? 'quiz-option-correct' : ''} ${isWrongPick ? 'quiz-option-wrong' : ''} ${isDimmed ? 'quiz-option-dimmed' : ''}`}
              style={{ backgroundColor: style.color }}
              onClick={() => handleAnswer(i as 0 | 1 | 2 | 3)}
              disabled={hasAnswered || isReveal}
            >
              <span className="quiz-option-shape">{style.shape}</span>
              <span className="quiz-option-label">{option}</span>
              {isCorrect && <span className="quiz-option-check">✓</span>}
              {isWrongPick && <span className="quiz-option-check">✗</span>}
            </button>
          );
        })}
      </div>

      {isReveal && (
        <p className={`quiz-reveal-feedback ${player.lastCorrect ? 'quiz-reveal-feedback-correct' : 'quiz-reveal-feedback-wrong'}`}>
          {player.lastCorrect
            ? `🎉 ¡Correcto! +${player.lastPointsEarned} puntos`
            : player.lastCorrect === false
              ? '❌ Fallaste esta pregunta'
              : '⌛ No respondiste a tiempo'}
        </p>
      )}
    </div>
  );
}
