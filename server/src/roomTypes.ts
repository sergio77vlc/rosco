import type { Difficulty, LetterState, Rosco, RoomStatus } from '@rosco/shared';

export interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  rosco: Rosco;
  progress: LetterState[];
  currentIndex: number;
  finishedAt: number | null;
  joinedAt: number;
}

export interface ServerRoom {
  code: string;
  hostSocketId: string;
  hostToken: string;
  hostConnected: boolean;
  status: RoomStatus;
  maxPlayers: number;
  roscoTheme: string;
  roscoDifficulty: Difficulty;
  roscoPool: Rosco[];
  timerSeconds: number;
  startedAt: number | null;
  endsAt: number | null;
  activePlayerId: string | null;
  players: Map<string, ServerPlayer>;
  finishTimeout: NodeJS.Timeout | null;
  hostDisconnectTimeout: NodeJS.Timeout | null;
}
