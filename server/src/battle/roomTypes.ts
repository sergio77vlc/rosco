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
  /** Si la partida usa un paquete de preguntas guardado, sus preguntas fijas (en vez de la pila viva). */
  packQuestions: QuizQuestion[] | null;
  /** Cola de índices barajados sin repetir sobre `packQuestions`, se rebaraja al agotarse. */
  packDrawQueue: number[];
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
