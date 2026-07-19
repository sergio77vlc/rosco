export type Difficulty = 'facil' | 'medio' | 'dificil';

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

export interface PlayerPublic {
  id: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
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
  rosco: Omit<Rosco, 'letters'> & { letters: Omit<LetterClue, 'answer'>[] };
  timerSeconds: number;
  startedAt: number | null;
  endsAt: number | null;
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

// ---- Socket.IO event payloads ----

export interface HostCreateRoomPayload {
  maxPlayers: number;
  rosco: Rosco;
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
