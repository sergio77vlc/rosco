import React, { createContext, useContext, useReducer } from 'react';
import { isAnswerCorrect } from '@rosco/shared';
import type { CrosswordPuzzle } from '@rosco/shared';

interface LocalCrosswordLastSolved {
  clueId: string;
  word: string;
  points: number;
  at: number;
}

interface LocalCrosswordState {
  puzzle: CrosswordPuzzle | null;
  solvedClueIds: Set<string>;
  score: number;
  wordsSolved: number;
  focusedClueId: string | null;
  lastSolved: LocalCrosswordLastSolved | null;
  finished: boolean;
}

type LocalCrosswordAction =
  | { type: 'SET_PUZZLE'; puzzle: CrosswordPuzzle }
  | { type: 'FOCUS'; clueId: string | null }
  | { type: 'SOLVE'; clueId: string }
  | { type: 'RESET' };

const initialState: LocalCrosswordState = {
  puzzle: null,
  solvedClueIds: new Set(),
  score: 0,
  wordsSolved: 0,
  focusedClueId: null,
  lastSolved: null,
  finished: false,
};

/** Puntos por palabra: proporcionales a su longitud, para premiar más las palabras largas. */
function pointsForLength(length: number): number {
  return length * 10;
}

function reducer(state: LocalCrosswordState, action: LocalCrosswordAction): LocalCrosswordState {
  switch (action.type) {
    case 'SET_PUZZLE':
      return { ...initialState, puzzle: action.puzzle };
    case 'FOCUS':
      return { ...state, focusedClueId: action.clueId };
    case 'SOLVE': {
      if (!state.puzzle) return state;
      const clue = state.puzzle.clues.find((c) => c.id === action.clueId);
      if (!clue || state.solvedClueIds.has(clue.id)) return state;
      const points = pointsForLength(clue.length);
      const solvedClueIds = new Set(state.solvedClueIds);
      solvedClueIds.add(clue.id);
      return {
        ...state,
        solvedClueIds,
        score: state.score + points,
        wordsSolved: state.wordsSolved + 1,
        lastSolved: { clueId: clue.id, word: clue.answer, points, at: Date.now() },
        finished: solvedClueIds.size >= state.puzzle.clues.length,
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface LocalCrosswordContextValue extends LocalCrosswordState {
  setPuzzle: (puzzle: CrosswordPuzzle) => void;
  focus: (clueId: string | null) => void;
  /** Valida la respuesta; si es correcta, actualiza el estado y devuelve true. */
  submit: (clueId: string, answerText: string) => boolean;
  reset: () => void;
}

const LocalCrosswordContext = createContext<LocalCrosswordContextValue | null>(null);

export function LocalCrosswordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function setPuzzle(puzzle: CrosswordPuzzle) {
    dispatch({ type: 'SET_PUZZLE', puzzle });
  }

  function focus(clueId: string | null) {
    dispatch({ type: 'FOCUS', clueId });
  }

  function submit(clueId: string, answerText: string): boolean {
    const clue = state.puzzle?.clues.find((c) => c.id === clueId);
    if (!clue) return false;
    const correct = isAnswerCorrect(answerText, clue.answer);
    if (correct) dispatch({ type: 'SOLVE', clueId });
    return correct;
  }

  function reset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <LocalCrosswordContext.Provider value={{ ...state, setPuzzle, focus, submit, reset }}>
      {children}
    </LocalCrosswordContext.Provider>
  );
}

export function useLocalCrossword(): LocalCrosswordContextValue {
  const ctx = useContext(LocalCrosswordContext);
  if (!ctx) throw new Error('useLocalCrossword debe usarse dentro de LocalCrosswordProvider');
  return ctx;
}
