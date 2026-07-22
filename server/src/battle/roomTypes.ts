import type { BattleAttackResult, BattleRoomStatus, MiiConfig, QuizDifficulty, QuizQuestion } from '@rosco/shared';

export interface ServerBattlePlayer {
  id: string;
  socketId: string;
  name: string;
  mii: MiiConfig;
  connected: boolean;
  hp: number;
  alive: boolean;
  joinedAt: number;
}

export interface ServerBattleRoom {
  code: string;
  hostSocketId: string;
  hostToken: string;
  hostConnected: boolean;
  status: BattleRoomStatus;
  maxPlayers: number;
  difficulty: QuizDifficulty;
  players: Map<string, ServerBattlePlayer>;
  turnOrder: string[];
  eliminationOrder: string[];
  activePlayerId: string | null;
  currentQuestion: QuizQuestion | null;
  questionEndsAt: number | null;
  attackTargetOptions: string[] | null;
  attackEndsAt: number | null;
  lastAttack: BattleAttackResult | null;
  lastAnswerCorrect: boolean | null;
  revealEndsAt: number | null;
  questionTimeout: NodeJS.Timeout | null;
  attackTimeout: NodeJS.Timeout | null;
  revealTimeout: NodeJS.Timeout | null;
  hostDisconnectTimeout: NodeJS.Timeout | null;
}
