import type { BattlePlayerPublic, BattleRankingEntry, MiiConfig } from '@rosco/shared';

/** Ranking de respaldo a partir del estado público de la sala, por si el cliente no llegó a
 * recibir el evento `battle:gameFinished` (p. ej. se unió tarde o recargó la página). */
export function fallbackBattleRanking(players: BattlePlayerPublic[]): BattleRankingEntry[] {
  return [...players]
    .sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.hp - a.hp)
    .map((p, i) => ({ playerId: p.id, name: p.name, mii: p.mii, place: i + 1 }));
}

interface LocalRankable {
  id: string;
  name: string;
  mii: MiiConfig;
  alive: boolean;
}

/** Ranking del modo local: el ganador es el único con vida; el resto, en orden inverso de eliminación. */
export function computeLocalBattleRanking<T extends LocalRankable>(
  players: T[],
  eliminationOrder: string[],
): BattleRankingEntry[] {
  const winner = players.find((p) => p.alive);
  const ordered: T[] = [];
  if (winner) ordered.push(winner);
  for (let i = eliminationOrder.length - 1; i >= 0; i--) {
    const p = players.find((pl) => pl.id === eliminationOrder[i]);
    if (p) ordered.push(p);
  }
  return ordered.map((p, i) => ({ playerId: p.id, name: p.name, mii: p.mii, place: i + 1 }));
}
