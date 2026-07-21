import { computeQuizPoints } from '@rosco/shared';
import type { QuizPlayerPublic, QuizRankingEntry, QuizRoomPublic } from '@rosco/shared';
import type { ServerQuizPlayer, ServerQuizRoom } from './roomTypes.js';

export function createQuizPlayer(
  id: string,
  socketId: string,
  name: string,
  color: string,
  avatar: string,
): ServerQuizPlayer {
  return {
    id,
    socketId,
    name,
    color,
    avatar,
    connected: true,
    score: 0,
    streak: 0,
    correctCount: 0,
    lastPointsEarned: null,
    lastCorrect: null,
    currentAnswer: null,
    joinedAt: Date.now(),
  };
}

/** Resuelve las respuestas de la pregunta actual: suma puntos y racha, deja el resultado listo para difundir. */
export function resolveCurrentQuestion(room: ServerQuizRoom): void {
  const question = room.questions[room.currentQuestionIndex];
  if (!question) return;
  const durationMs = room.questionDurationSeconds * 1000;
  const endsAt = room.questionEndsAt ?? Date.now();
  for (const player of room.players.values()) {
    const answer = player.currentAnswer;
    const correct = !!answer && answer.optionIndex === question.correctIndex;
    const remainingMs = answer ? Math.max(0, endsAt - answer.answeredAt) : 0;
    const points = computeQuizPoints(correct, remainingMs, durationMs);
    player.score += points;
    player.streak = correct ? player.streak + 1 : 0;
    if (correct) player.correctCount += 1;
    player.lastPointsEarned = points;
    player.lastCorrect = answer ? correct : null;
  }
}

export function computeQuizRanking(room: ServerQuizRoom): QuizRankingEntry[] {
  const sorted = Array.from(room.players.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.correctCount - a.correctCount;
  });
  return sorted.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    color: p.color,
    avatar: p.avatar,
    score: p.score,
    correctCount: p.correctCount,
    rank: i + 1,
  }));
}

function toPublicPlayer(player: ServerQuizPlayer): QuizPlayerPublic {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    avatar: player.avatar,
    connected: player.connected,
    score: player.score,
    streak: player.streak,
    hasAnswered: player.currentAnswer !== null,
    lastPointsEarned: player.lastPointsEarned,
    lastCorrect: player.lastCorrect,
  };
}

export function toPublicQuizRoom(room: ServerQuizRoom): QuizRoomPublic {
  const question = room.questions[room.currentQuestionIndex] ?? null;
  const showCorrectIndex = room.status === 'reveal' || room.status === 'finished';
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
    questionCount: room.questionCount,
    questionDurationSeconds: room.questionDurationSeconds,
    currentQuestionIndex: room.currentQuestionIndex,
    currentQuestion:
      question && (room.status === 'question' || room.status === 'reveal')
        ? { id: question.id, question: question.question, options: question.options, difficulty: question.difficulty }
        : null,
    questionEndsAt: room.questionEndsAt,
    revealCorrectIndex: showCorrectIndex && question ? question.correctIndex : null,
    revealEndsAt: room.revealEndsAt,
    players: Array.from(room.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(toPublicPlayer),
  };
}
