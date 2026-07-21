import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { assignRoscos, createInitialProgress, isAnswerCorrect, resolveCurrentLetter } from '@rosco/shared';
import type { Difficulty, LetterState, Rosco } from '@rosco/shared';

export interface LocalPlayerState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  rosco: Rosco;
  progress: LetterState[];
  currentIndex: number;
  finishedAt: number | null;
}

export type LocalPhase = 'playing' | 'results';

export interface LocalOutcomeEvent {
  seq: number;
  playerName: string;
  correctCount: number;
  result: 'correct' | 'wrong' | 'passed';
  correctAnswer: string | null;
}

interface LocalGameState {
  roscoTheme: string;
  roscoDifficulty: Difficulty | null;
  timerSeconds: number;
  players: LocalPlayerState[];
  activePlayerIndex: number;
  phase: LocalPhase;
  endsAt: number | null;
  /**
   * Último acierto/fallo/pasapalabra resuelto. Se expone aparte del progreso del jugador
   * porque, cuando el turno cambia, la pantalla pasa a mostrar a otro jugador (remonta el
   * panel de juego) antes de que ese componente pudiera enterarse por sí solo del resultado.
   */
  lastEvent: LocalOutcomeEvent | null;
}

type LocalGameAction =
  | {
      type: 'START_GAME';
      roscoPool: Rosco[];
      timerSeconds: number;
      players: { name: string; color: string; avatar: string }[];
    }
  | { type: 'RESOLVE'; resolution: 'correct' | 'wrong' | 'passed'; correctAnswer: string }
  | { type: 'TIME_UP' }
  | { type: 'RESET' };

const initialState: LocalGameState = {
  roscoTheme: '',
  roscoDifficulty: null,
  timerSeconds: 120,
  players: [],
  activePlayerIndex: 0,
  phase: 'playing',
  endsAt: null,
  lastEvent: null,
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
      const roscos = assignRoscos(action.roscoPool, action.players.length);
      const players: LocalPlayerState[] = action.players.map((p, i) => ({
        id: `local-${i}`,
        name: p.name,
        color: p.color,
        avatar: p.avatar,
        rosco: roscos[i],
        progress: createInitialProgress(roscos[i].letters.length),
        currentIndex: 0,
        finishedAt: null,
      }));
      const first = action.roscoPool[0];
      return {
        roscoTheme: first?.theme ?? '',
        roscoDifficulty: first?.difficulty ?? null,
        timerSeconds: action.timerSeconds,
        players,
        activePlayerIndex: 0,
        phase: 'playing',
        endsAt: Date.now() + action.timerSeconds * 1000,
        lastEvent: null,
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
      const lastEvent: LocalOutcomeEvent = {
        seq: (state.lastEvent?.seq ?? 0) + 1,
        playerName: player.name,
        correctCount: updatedPlayer.progress.filter((s) => s === 'correct').length,
        result: action.resolution,
        correctAnswer: action.resolution === 'wrong' ? action.correctAnswer : null,
      };

      // Un acierto conserva el turno (salvo que ya no le queden letras); un fallo o un
      // pasapalabra siempre cede el turno al siguiente jugador, como en el rosco real.
      const keepsTurn = action.resolution === 'correct' && !result.finished;
      if (keepsTurn) {
        return { ...state, players, lastEvent };
      }
      const nextIdx = nextActivePlayerIndex(players, state.activePlayerIndex);
      if (nextIdx === null) {
        return { ...state, players, phase: 'results', endsAt: null, lastEvent };
      }
      return { ...state, players, activePlayerIndex: nextIdx, lastEvent };
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
    roscoPool: Rosco[],
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
    roscoPool: Rosco[],
    timerSeconds: number,
    players: { name: string; color: string; avatar: string }[],
  ) {
    dispatch({ type: 'START_GAME', roscoPool, timerSeconds, players });
  }

  function submitAnswer(answerText: string) {
    const player = state.players[state.activePlayerIndex];
    if (!player || player.finishedAt) return;
    const clue = player.rosco.letters[player.currentIndex];
    const correct = isAnswerCorrect(answerText, clue.answer);
    dispatch({ type: 'RESOLVE', resolution: correct ? 'correct' : 'wrong', correctAnswer: clue.answer });
  }

  function pass() {
    const player = state.players[state.activePlayerIndex];
    if (!player || player.finishedAt) return;
    const clue = player.rosco.letters[player.currentIndex];
    dispatch({ type: 'RESOLVE', resolution: 'passed', correctAnswer: clue.answer });
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
