import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { createInitialProgress, isAnswerCorrect, resolveCurrentLetter } from '@rosco/shared';
import type { LetterState, Rosco } from '@rosco/shared';

export interface LocalPlayerState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  progress: LetterState[];
  currentIndex: number;
  finishedAt: number | null;
}

export type LocalPhase = 'playing' | 'results';

interface LocalGameState {
  rosco: Rosco | null;
  timerSeconds: number;
  players: LocalPlayerState[];
  activePlayerIndex: number;
  phase: LocalPhase;
  endsAt: number | null;
}

type LocalGameAction =
  | {
      type: 'START_GAME';
      rosco: Rosco;
      timerSeconds: number;
      players: { name: string; color: string; avatar: string }[];
    }
  | { type: 'RESOLVE'; resolution: 'correct' | 'wrong' | 'passed' }
  | { type: 'TIME_UP' }
  | { type: 'RESET' };

const initialState: LocalGameState = {
  rosco: null,
  timerSeconds: 120,
  players: [],
  activePlayerIndex: 0,
  phase: 'playing',
  endsAt: null,
};

/** Siguiente jugador (dando la vuelta) que todavía no ha terminado su rosco entero. Null si no queda ninguno. */
function nextActivePlayerIndex(players: LocalPlayerState[], fromIndex: number): number | null {
  const n = players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n;
    if (!players[idx].finishedAt) return idx;
  }
  return null;
}

function localGameReducer(state: LocalGameState, action: LocalGameAction): LocalGameState {
  switch (action.type) {
    case 'START_GAME': {
      const players: LocalPlayerState[] = action.players.map((p, i) => ({
        id: `local-${i}`,
        name: p.name,
        color: p.color,
        avatar: p.avatar,
        progress: createInitialProgress(action.rosco.letters.length),
        currentIndex: 0,
        finishedAt: null,
      }));
      return {
        rosco: action.rosco,
        timerSeconds: action.timerSeconds,
        players,
        activePlayerIndex: 0,
        phase: 'playing',
        endsAt: Date.now() + action.timerSeconds * 1000,
      };
    }
    case 'RESOLVE': {
      const player = state.players[state.activePlayerIndex];
      if (!player || player.finishedAt) return state;
      const result = resolveCurrentLetter(player.progress, player.currentIndex, action.resolution);
      const updatedPlayer: LocalPlayerState = {
        ...player,
        progress: result.progress,
        currentIndex: result.currentIndex,
        finishedAt: result.finished ? Date.now() : null,
      };
      const players = state.players.map((p, i) => (i === state.activePlayerIndex ? updatedPlayer : p));

      // Un acierto conserva el turno (salvo que ya no le queden letras); un fallo o un
      // pasapalabra siempre cede el turno al siguiente jugador, como en el rosco real.
      const keepsTurn = action.resolution === 'correct' && !result.finished;
      if (keepsTurn) {
        return { ...state, players };
      }
      const nextIdx = nextActivePlayerIndex(players, state.activePlayerIndex);
      if (nextIdx === null) {
        return { ...state, players, phase: 'results', endsAt: null };
      }
      return { ...state, players, activePlayerIndex: nextIdx };
    }
    case 'TIME_UP':
      return { ...state, phase: 'results', endsAt: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface LocalGameContextValue extends LocalGameState {
  startGame: (
    rosco: Rosco,
    timerSeconds: number,
    players: { name: string; color: string; avatar: string }[],
  ) => void;
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
    if (state.phase === 'playing' && state.endsAt) {
      const delay = Math.max(0, state.endsAt - Date.now());
      timeoutRef.current = setTimeout(() => dispatch({ type: 'TIME_UP' }), delay);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.phase, state.endsAt]);

  function startGame(
    rosco: Rosco,
    timerSeconds: number,
    players: { name: string; color: string; avatar: string }[],
  ) {
    dispatch({ type: 'START_GAME', rosco, timerSeconds, players });
  }

  function submitAnswer(answerText: string) {
    const player = state.players[state.activePlayerIndex];
    if (!state.rosco || !player || player.finishedAt) return;
    const clue = state.rosco.letters[player.currentIndex];
    const correct = isAnswerCorrect(answerText, clue.answer);
    dispatch({ type: 'RESOLVE', resolution: correct ? 'correct' : 'wrong' });
  }

  function pass() {
    const player = state.players[state.activePlayerIndex];
    if (!player || player.finishedAt) return;
    dispatch({ type: 'RESOLVE', resolution: 'passed' });
  }

  function resetGame() {
    dispatch({ type: 'RESET' });
  }

  return (
    <LocalGameContext.Provider value={{ ...state, startGame, submitAnswer, pass, resetGame }}>
      {children}
    </LocalGameContext.Provider>
  );
}

export function useLocalGame(): LocalGameContextValue {
  const ctx = useContext(LocalGameContext);
  if (!ctx) throw new Error('useLocalGame debe usarse dentro de LocalGameProvider');
  return ctx;
}
