import type { PlayerPublic, RankingEntry } from '@rosco/shared';

export function rankPlayers(players: PlayerPublic[]): RankingEntry[] {
  const sorted = [...players].sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (a.wrongCount !== b.wrongCount) return a.wrongCount - b.wrongCount;
    const aFinished = a.finishedAt ?? Infinity;
    const bFinished = b.finishedAt ?? Infinity;
    return aFinished - bFinished;
  });
  return sorted.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    color: p.color,
    avatar: p.avatar,
    correctCount: p.correctCount,
    wrongCount: p.wrongCount,
    finishedAt: p.finishedAt,
    rank: i + 1,
  }));
}
