import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { BATTLE_START_HP, BATTLE_WEAPONS } from '@rosco/shared';
import type { MiiConfig, QuizQuestion } from '@rosco/shared';

export interface LocalBattlePlayerState {
  id: string;
  name: string;
  mii: MiiConfig;
  hp: number;
  alive: boolean;
}

export type LocalBattlePhase = 'question' | 'attacking' | 'reveal' | 'results';

export interface LocalBattleAttack {
  attackerId: string;
  targetId: string;
  weaponId: string;
  damage: number;
}

interface LocalBattleState {
  players: LocalBattlePlayerState[];
  turnOrder: string[];
  eliminationOrder: string[];
  activePlayerId: string | null;
  questionPool: QuizQuestion[];
  poolIndex: number;
  currentQuestion: QuizQuestion | null;
  phase: LocalBattlePhase;
  attackTargetOptions: string[] | null;
  lastAttack: LocalBattleAttack | null;
  lastAnswerCorrect: boolean | null;
}

type LocalBattleAction =
  | { type: 'START_GAME'; questionPool: QuizQuestion[]; players: { name: string; mii: MiiConfig }[] }
  | { type: 'ANSWER'; correct: boolean }
  | { type: 'ATTACK'; targetId: string; weaponId: string }
  | { type: 'NEXT_TURN' }
  | { type: 'RESET' };

const initialState: LocalBattleState = {
  players: [],
  turnOrder: [],
  eliminationOrder: [],
  activePlayerId: null,
  questionPool: [],
  poolIndex: 0,
  currentQuestion: null,
  phase: 'question',
  attackTargetOptions: null,
  lastAttack: null,
  lastAnswerCorrect: null,
};

function nextAlivePlayerId(state: LocalBattleState, afterId: string | null): string | null {
  const order = state.turnOrder;
  if (order.length === 0) return null;
  const startIdx = afterId ? order.indexOf(afterId) : -1;
  for (let i = 1; i <= order.length; i++) {
    const idx = (startIdx + i + order.length) % order.length;
    const candidate = state.players.find((p) => p.id === order[idx]);
    if (candidate?.alive) return candidate.id;
  }
  return null;
}

function aliveCount(state: LocalBattleState): number {
  return state.players.filter((p) => p.alive).length;
}

function drawQuestion(state: LocalBattleState): { question: QuizQuestion | null; poolIndex: number } {
  if (state.questionPool.length === 0) return { question: null, poolIndex: state.poolIndex };
  const idx = state.poolIndex % state.questionPool.length;
  return { question: state.questionPool[idx], poolIndex: state.poolIndex + 1 };
}

function localBattleReducer(state: LocalBattleState, action: LocalBattleAction): LocalBattleState {
  switch (action.type) {
    case 'START_GAME': {
      const players: LocalBattlePlayerState[] = action.players.map((p, i) => ({
        id: `local-battle-${i}`,
        name: p.name,
        mii: p.mii,
        hp: BATTLE_START_HP,
        alive: true,
      }));
      const turnOrder = players.map((p) => p.id);
      const base: LocalBattleState = {
        ...initialState,
        players,
        turnOrder,
        activePlayerId: turnOrder[0] ?? null,
        questionPool: action.questionPool,
        poolIndex: 0,
      };
      const { question, poolIndex } = drawQuestion(base);
      return { ...base, currentQuestion: question, poolIndex, phase: 'question' };
    }
    case 'ANSWER': {
      if (state.phase !== 'question' || !state.activePlayerId) return state;
      if (!action.correct) {
        return { ...state, phase: 'reveal', lastAnswerCorrect: false, lastAttack: null };
      }
      const opponents = state.players.filter((p) => p.alive && p.id !== state.activePlayerId);
      if (opponents.length === 0) {
        return { ...state, phase: 'reveal', lastAnswerCorrect: false, lastAttack: null };
      }
      return { ...state, phase: 'attacking', attackTargetOptions: opponents.map((p) => p.id) };
    }
    case 'ATTACK': {
      if (state.phase !== 'attacking' || !state.activePlayerId) return state;
      const weapon = BATTLE_WEAPONS.find((w) => w.id === action.weaponId) ?? BATTLE_WEAPONS[0];
      let eliminationOrder = state.eliminationOrder;
      const players = state.players.map((p) => {
        if (p.id !== action.targetId) return p;
        const hp = Math.max(0, p.hp - weapon.damage);
        const alive = hp > 0;
        if (!alive && p.alive) eliminationOrder = [...eliminationOrder, p.id];
        return { ...p, hp, alive };
      });
      const lastAttack: LocalBattleAttack = {
        attackerId: state.activePlayerId,
        targetId: action.targetId,
        weaponId: weapon.id,
        damage: weapon.damage,
      };
      return {
        ...state,
        players,
        eliminationOrder,
        phase: 'reveal',
        lastAnswerCorrect: true,
        lastAttack,
        attackTargetOptions: null,
      };
    }
    case 'NEXT_TURN': {
      if (state.phase !== 'reveal') return state;
      if (aliveCount(state) <= 1) {
        return { ...state, phase: 'results' };
      }
      const activePlayerId = nextAlivePlayerId(state, state.activePlayerId);
      const withActive = { ...state, activePlayerId };
      const { question, poolIndex } = drawQuestion(withActive);
      return { ...withActive, currentQuestion: question, poolIndex, phase: 'question', lastAttack: null, lastAnswerCorrect: null };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface LocalBattleContextValue extends LocalBattleState {
  startGame: (questionPool: QuizQuestion[], players: { name: string; mii: MiiConfig }[]) => void;
  answer: (correct: boolean) => void;
  attack: (targetId: string, weaponId: string) => void;
  resetGame: () => void;
}

const LocalBattleContext = createContext<LocalBattleContextValue | null>(null);

const REVEAL_MS = 3500;

export function LocalBattleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(localBattleReducer, initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (state.phase === 'reveal') {
      timeoutRef.current = setTimeout(() => dispatch({ type: 'NEXT_TURN' }), REVEAL_MS);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.phase, state.lastAttack]);

  function startGame(questionPool: QuizQuestion[], players: { name: string; mii: MiiConfig }[]) {
    dispatch({ type: 'START_GAME', questionPool, players });
  }

  function answer(correct: boolean) {
    dispatch({ type: 'ANSWER', correct });
  }

  function attack(targetId: string, weaponId: string) {
    dispatch({ type: 'ATTACK', targetId, weaponId });
  }

  function resetGame() {
    dispatch({ type: 'RESET' });
  }

  return (
    <LocalBattleContext.Provider value={{ ...state, startGame, answer, attack, resetGame }}>
      {children}
    </LocalBattleContext.Provider>
  );
}

export function useLocalBattle(): LocalBattleContextValue {
  const ctx = useContext(LocalBattleContext);
  if (!ctx) throw new Error('useLocalBattle debe usarse dentro de LocalBattleProvider');
  return ctx;
}
