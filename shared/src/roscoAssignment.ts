import type { Difficulty, Rosco } from './types.js';

/**
 * Roscos candidatos para una partida: mismo tema y dificultad que el rosco elegido por
 * quien hospeda/configura. Si no hay roscos predefinidos que encajen (p. ej. viene de IA,
 * o es un tema/dificultad sin más variantes en el banco), se usa únicamente el elegido.
 */
export function buildRoscoPool(allRoscos: Rosco[], theme: string, difficulty: Difficulty, chosen: Rosco): Rosco[] {
  if (chosen.source !== 'preset') return [chosen];
  const pool = allRoscos.filter((r) => r.theme === theme && r.difficulty === difficulty);
  return pool.length > 0 ? pool : [chosen];
}

/** Reparte roscos del pool entre `count` jugadores, distintos entre sí mientras el pool alcance. */
export function assignRoscos(pool: Rosco[], count: number): Rosco[] {
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}
