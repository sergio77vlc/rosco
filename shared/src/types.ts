export type Difficulty = 'medio' | 'dificil';

export type MatchType = 'starts' | 'contains';

export interface LetterClue {
  letter: string;
  clue: string;
  answer: string;
  matchType: MatchType;
}

export interface Rosco {
  id: string;
  title: string;
  difficulty: Difficulty;
  theme: string;
  letters: LetterClue[];
  source: 'preset' | 'ai';
}

export type LetterState = 'pending' | 'active' | 'correct' | 'wrong' | 'passed';

export interface PlayerProgressEntry {
  state: LetterState;
}

/** Rosco de un jugador tal y como se envía al cliente: sin las respuestas. */
export type PlayerRoscoView = Omit<Rosco, 'letters'> & { letters: Omit<LetterClue, 'answer'>[] };

export interface PlayerPublic {
  id: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  rosco: PlayerRoscoView;
  progress: PlayerProgressEntry[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  finishedAt: number | null;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface RoomPublic {
  code: string;
  status: RoomStatus;
  maxPlayers: number;
  roscoTheme: string;
  roscoDifficulty: Difficulty;
  timerSeconds: number;
  startedAt: number | null;
  endsAt: number | null;
  activePlayerId: string | null;
  players: PlayerPublic[];
}

export interface RankingEntry {
  playerId: string;
  name: string;
  color: string;
  avatar: string;
  correctCount: number;
  wrongCount: number;
  finishedAt: number | null;
  rank: number;
}

export interface TurnAwarePlayer {
  id: string;
  finishedAt: number | null;
}

/**
 * Cómo se elige el rosco al configurar una partida: o bien un nivel de dificultad del banco
 * de preguntas vivo (el servidor reparte roscos distintos extraídos de la pila), o bien un
 * rosco ya generado por IA (se reparte el mismo entre todos los jugadores).
 */
export type RoscoSelection =
  | { mode: 'preset'; theme: string; difficulty: Difficulty }
  | { mode: 'ai'; rosco: Rosco };

// ---- Socket.IO event payloads ----

export interface HostCreateRoomPayload {
  maxPlayers: number;
  selection: RoscoSelection;
  timerSeconds: number;
}

export interface PlayerJoinRoomPayload {
  code: string;
  name: string;
  color: string;
  avatar: string;
}

export interface PlayerSubmitAnswerPayload {
  code: string;
  answerText: string;
}

export interface PlayerPassPayload {
  code: string;
}

export interface RoomErrorPayload {
  reason: string;
}

export interface GameFinishedPayload {
  ranking: RankingEntry[];
}

export const PLAYER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
] as const;

/** Avatares emoji predefinidos para elegir sin necesidad de cámara. */
export const PLAYER_AVATARS = [
  '🦁', '🐯', '🐻', '🐼', '🦊', '🐨', '🐸', '🐵',
  '🦄', '🐲', '🦉', '🐺', '🐱', '🐶', '🦋', '🐝',
  '🦅', '🐳', '🐙', '🦖', '🎃', '👻', '🤖', '👽',
] as const;

export const DEFAULT_AVATAR = PLAYER_AVATARS[0];
