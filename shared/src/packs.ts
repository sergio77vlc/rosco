import type { Difficulty, QuizQuestion, Rosco } from './types.js';

// ==========================================================================
// Paquetes de contenido creados con IA: se guardan en el servidor (persisten
// aunque se reinicie la aplicación) y se pueden buscar, filtrar y reutilizar
// desde cualquier partida, en vez de generarse una sola vez y perderse.
// ==========================================================================

export type PackDomain = 'rosco' | 'quiz' | 'battle';

export interface RoscoPack {
  id: string;
  domain: 'rosco';
  name: string;
  difficulty: Difficulty;
  createdAt: number;
  roscos: Rosco[];
}

export interface QuizPack {
  id: string;
  domain: 'quiz' | 'battle';
  name: string;
  difficulty: Difficulty;
  createdAt: number;
  questions: QuizQuestion[];
}

export type ContentPack = RoscoPack | QuizPack;

/** Versión ligera de un paquete para listarlo (sin el contenido completo). */
export interface PackSummary {
  id: string;
  name: string;
  difficulty: Difficulty;
  createdAt: number;
  count: number;
}

export interface GeneratePackPayload {
  theme: string;
  difficulty: Difficulty;
}
