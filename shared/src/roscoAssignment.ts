import type { Rosco } from './types.js';

/** Reparte roscos del pool entre `count` jugadores, distintos entre sí mientras el pool alcance. */
export function assignRoscos(pool: Rosco[], count: number): Rosco[] {
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}
