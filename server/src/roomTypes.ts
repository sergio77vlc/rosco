import type { LetterState, Rosco, RoomStatus } from '@rosco/shared';

export interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  progress: LetterState[];
  currentIndex: number;
  finishedAt: number | null;
  joinedAt: number;
}

export interface ServerRoom {
  code: string;
  hostSocketId: string;
  status: RoomStatus;
  maxPlayers: number;
  rosco: Rosco;
  timerSeconds: number;
  startedAt: number | null;
  endsAt: number | null;
  players: Map<string, ServerPlayer>;
  finishTimeout: NodeJS.Timeout | null;
}
