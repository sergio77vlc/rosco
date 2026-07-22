import type { CrosswordPuzzle, CrosswordRoomStatus } from '@rosco/shared';

export interface ServerCrosswordPlayer {
  id: string;
  socketId: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  score: number;
  wordsSolved: number;
  focusedClueId: string | null;
  joinedAt: number;
}

export interface ServerCrosswordLastSolved {
  clueId: string;
  playerName: string;
  word: string;
  points: number;
  at: number;
}

export interface ServerCrosswordRoom {
  code: string;
  hostSocketId: string;
  hostToken: string;
  hostConnected: boolean;
  status: CrosswordRoomStatus;
  maxPlayers: number;
  puzzle: CrosswordPuzzle;
  solvedClueIds: Set<string>;
  solvedByName: Map<string, string>;
  lastSolved: ServerCrosswordLastSolved | null;
  players: Map<string, ServerCrosswordPlayer>;
  hostDisconnectTimeout: NodeJS.Timeout | null;
}
