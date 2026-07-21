import type { QuizDifficulty, QuizQuestion, QuizRoomStatus } from '@rosco/shared';

export interface ServerQuizAnswer {
  optionIndex: 0 | 1 | 2 | 3;
  answeredAt: number;
}

export interface ServerQuizPlayer {
  id: string;
  socketId: string;
  name: string;
  color: string;
  avatar: string;
  connected: boolean;
  score: number;
  streak: number;
  correctCount: number;
  lastPointsEarned: number | null;
  lastCorrect: boolean | null;
  currentAnswer: ServerQuizAnswer | null;
  joinedAt: number;
}

export interface ServerQuizRoom {
  code: string;
  hostSocketId: string;
  status: QuizRoomStatus;
  maxPlayers: number;
  difficulty: QuizDifficulty;
  questionCount: number;
  questionDurationSeconds: number;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionEndsAt: number | null;
  revealEndsAt: number | null;
  players: Map<string, ServerQuizPlayer>;
  questionTimeout: NodeJS.Timeout | null;
  revealTimeout: NodeJS.Timeout | null;
}
