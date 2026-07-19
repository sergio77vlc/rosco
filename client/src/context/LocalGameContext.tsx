import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { createInitialProgress, isAnswerCorrect, resolveCurrentLetter } from '@rosco/shared';
import type { LetterState, Rosco } from '@rosco/shared';

export interface LocalPlayerState {
  id: string;
  name: string;
  color: string;
  progress: LetterState[];
  currentIndex: number;
  finishedAt: number | null;
}

export type LocalPhase = 'handoff' | 'playing' | 'results';

interface LocalGameState {
  rosco: Rosco | null;
  timerSeconds: number;
  players: LocalPlayerState[];
  currentPlayerIndex: number;
  phase: LocalPhase;
  currentEndsAt: number | null;
}

type LocalGameAction =
  | { type: 'START_GAME'; rosco: Rosco; timerSeconds: number; players: { name: string; color: string }[] }
  | { type: 'BEGIN_TURN' }
  | { type: 'RESOLVE'; resolution: 'correct' | 'wrong' | 'passed' }
  | { type: 'TIME_UP' }
  | { type: 'RESET' };

const initialState: LocalGameState = {
  rosco: null,
  timerSeconds: 120,
  players: [],
  currentPlayerIndex: 0,
  phase: 'handoff',
  currentEndsAt: null,
};

function advancePhase(state: LocalGameState): LocalGameState {
  const nextIndex = state.currentPlayerIndex + 1;
  if (nextIndex >= state.players.length) {
    return { ...state, phase: 'results', currentEndsAt: null };
  }
  return { ...state, currentPlayerIndex: nextIndex, phase: 'handoff', currentEndsAt: null };
}

function localGameReducer(state: LocalGameState, action: LocalGameAction): LocalGameState {
  switch (action.type) {
    case 'START_GAME': {
      const players: LocalPlayerState[] = action.players.map((p, i) => ({
        id: `local-${i}`,
        name: p.name,
        color: p.color,
        progress: createInitialProgress(action.rosco.letters.length),
        currentIndex: 0,
        finishedAt: null,
      }));
      return {
        rosco: action.rosco,
        timerSeconds: action.timerSeconds,
        players,
        currentPlayerIndex: 0,
        phase: 'handoff',
        currentEndsAt: null,
      };
    }
    case 'BEGIN_TURN':
      return { ...state, phase: 'playing', currentEndsAt: Date.now() + state.timerSeconds * 1000 };
    case 'RESOLVE': {
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.finishedAt) return state;
      const result = resolveCurrentLetter(player.progress, player.currentIndex, action.resolution);
      const updatedPlayer: LocalPlayerState = {
        ...player,
        progress: result.progress,
        currentIndex: result.currentIndex,
        finishedAt: result.finished ? Date.now() : null,
      };
      const players = state.players.map((p, i) => (i === state.currentPlayerIndex ? updatedPlayer : p));
      const nextState = { ...state, players };
      return result.finished ? advancePhase(nextState) : nextState;
    }
    case 'TIME_UP': {
      const player = state.players[state.currentPlayerIndex];
      if (!player || player.finishedAt) return state;
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex ? { ...p, finishedAt: Date.now() } : p,
      );
      return advancePhase({ ...state, players });
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface LocalGameContextValue extends LocalGameState {
  startGame: (rosco: Rosco, timerSeconds: number, players: { name: string; color: string }[]) => void;
  beginCurrentTurn: () => void;
  submitAnswer: (answerText: string) => void;
  pass: () => void;
  resetGame: () => void;
}

const LocalGameContext = createContext<LocalGameContextValue | null>(null);

export function LocalGameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(localGameReducer, initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (state.phase === 'playing' && state.currentEndsAt) {
      const delay = Math.max(0, state.currentEndsAt - Date.now());
      timeoutRef.current = setTimeout(() => dispatch({ type: 'TIME_UP' }), delay);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.phase, state.currentEndsAt]);

  function startGame(rosco: Rosco, timerSeconds: number, players: { name: string; color: string }[]) {
    dispatch({ type: 'START_GAME', rosco, timerSeconds, players });
  }

  function beginCurrentTurn() {
    dispatch({ type: 'BEGIN_TURN' });
  }

  function submitAnswer(answerText: string) {
    const player = state.players[state.currentPlayerIndex];
    if (!state.rosco || !player || player.finishedAt) return;
    const clue = state.rosco.letters[player.currentIndex];
    const correct = isAnswerCorrect(answerText, clue.answer);
    dispatch({ type: 'RESOLVE', resolution: correct ? 'correct' : 'wrong' });
  }

  function pass() {
    const player = state.players[state.currentPlayerIndex];
    if (!player || player.finishedAt) return;
    dispatch({ type: 'RESOLVE', resolution: 'passed' });
  }

  function resetGame() {
    dispatch({ type: 'RESET' });
  }

  return (
    <LocalGameContext.Provider value={{ ...state, startGame, beginCurrentTurn, submitAnswer, pass, resetGame }}>
      {children}
    </LocalGameContext.Provider>
  );
}

export function useLocalGame(): LocalGameContextValue {
  const ctx = useContext(LocalGameContext);
  if (!ctx) throw new Error('useLocalGame debe usarse dentro de LocalGameProvider');
  return ctx;
}
