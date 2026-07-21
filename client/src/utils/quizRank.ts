import type { QuizPlayerPublic, QuizRankingEntry } from '@rosco/shared';

/** Ranking de respaldo a partir del estado público de la sala, por si el cliente no llegó a
 * recibir el evento `quiz:gameFinished` (p. ej. se unió tarde o recargó la página). */
export function fallbackQuizRanking(players: QuizPlayerPublic[]): QuizRankingEntry[] {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      playerId: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      score: p.score,
      correctCount: 0,
      rank: i + 1,
    }));
}
