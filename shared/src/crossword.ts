import type { Difficulty } from './types.js';

// ==========================================================================
// Crucigramas: todos los dispositivos resuelven el MISMO tablero a la vez,
// sin turnos. Cada palabra resuelta suma puntos a quien la acertó. Sin
// límite de tiempo: la partida termina cuando se completan todas las
// palabras.
// ==========================================================================

export type CrosswordDirection = 'across' | 'down';

/** Definición completa de una palabra, con la respuesta — solo vive en el servidor. */
export interface CrosswordClueDef {
  id: string;
  number: number;
  direction: CrosswordDirection;
  row: number;
  col: number;
  length: number;
  clue: string;
  /** Mayúsculas, sin acentos ni espacios. */
  answer: string;
}

/** Definición completa de un crucigrama, con las respuestas — solo vive en el servidor
 * (salvo en el modo local de un jugador, donde el propio dispositivo necesita validarlas). */
export interface CrosswordPuzzle {
  id: string;
  title: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  clues: CrosswordClueDef[];
}

/** Versión ligera para listar los crucigramas disponibles, sin las palabras. */
export interface CrosswordSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  wordCount: number;
}

// ---- Vistas públicas (sin respuestas) para la partida en red ----

export interface CrosswordClueView {
  id: string;
  number: number;
  direction: CrosswordDirection;
  row: number;
  col: number;
  length: number;
  clue: string;
  solved: boolean;
  solvedBy: string | null;
}

export interface CrosswordCellView {
  blocked: boolean;
  number: number | null;
  /** Letra revelada (una vez resuelta la palabra que ocupa esta celda), o null si aún no. */
  letter: string | null;
}

export type CrosswordRoomStatus = 'lobby' | 'playing' | 'finished';

export interface CrosswordPlayerPublic {
  id: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  score: number;
  wordsSolved: number;
  /** Id de la pista que este jugador tiene abierta ahora mismo, para resaltarla en todos los dispositivos. */
  focusedClueId: string | null;
}

export interface CrosswordLastSolved {
  clueId: string;
  playerName: string;
  word: string;
  points: number;
  /** Cambia en cada acierto: permite disparar la narración una sola vez por evento. */
  at: number;
}

export interface CrosswordRoomPublic {
  code: string;
  status: CrosswordRoomStatus;
  maxPlayers: number;
  puzzleTitle: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  grid: CrosswordCellView[][];
  clues: CrosswordClueView[];
  players: CrosswordPlayerPublic[];
  hostConnected: boolean;
  lastSolved: CrosswordLastSolved | null;
}

export interface CrosswordRankingEntry {
  playerId: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  wordsSolved: number;
  place: number;
}

// ---- Eventos de Socket.IO ----

export interface CrosswordHostCreateRoomPayload {
  maxPlayers: number;
  puzzleId: string;
}

export interface CrosswordPlayerJoinRoomPayload {
  code: string;
  name: string;
  color: string;
  avatar: string;
}

export interface CrosswordPlayerFocusPayload {
  code: string;
  clueId: string | null;
}

export interface CrosswordPlayerSubmitPayload {
  code: string;
  clueId: string;
  answerText: string;
}

export interface CrosswordGameFinishedPayload {
  ranking: CrosswordRankingEntry[];
}
