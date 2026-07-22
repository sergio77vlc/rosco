import type { CrosswordPlayerPublic, CrosswordRankingEntry } from '@rosco/shared';

/** Ranking de respaldo a partir del estado público de la sala, por si el cliente no llegó a
 * recibir el evento `crossword:gameFinished` (p. ej. se unió tarde o recargó la página). */
export function fallbackCrosswordRanking(players: CrosswordPlayerPublic[]): CrosswordRankingEntry[] {
  return [...players]
    .sort((a, b) => b.score - a.score || b.wordsSolved - a.wordsSolved)
    .map((p, i) => ({
      playerId: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      score: p.score,
      wordsSolved: p.wordsSolved,
      place: i + 1,
    }));
}
