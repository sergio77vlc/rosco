import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizRoomPublic } from '@rosco/shared';
import { useQuiz } from '../../context/QuizContext';
import QuizPodium from '../../components/QuizPodium';
import { fallbackQuizRanking } from '../../utils/quizRank';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS } from '../../constants';

interface QuizHostResultsProps {
  room: QuizRoomPublic;
}

export default function QuizHostResults({ room }: QuizHostResultsProps) {
  const navigate = useNavigate();
  const { ranking } = useQuiz();
  const finalRanking = ranking ?? fallbackQuizRanking(room.players);

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">🏁 Resultados finales</h1>
      <h2 className="app-subtitle">
        {QUIZ_DIFFICULTY_ICONS[room.difficulty]} {QUIZ_DIFFICULTY_LABELS[room.difficulty]} · {room.questionCount} preguntas
      </h2>

      <QuizPodium ranking={finalRanking} />

      <button className="btn btn-primary btn-big" onClick={() => navigate('/quiz/host')}>
        🔁 Nueva partida
      </button>
    </div>
  );
}
