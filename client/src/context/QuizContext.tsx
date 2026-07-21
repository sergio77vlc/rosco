import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { QuizRankingEntry, QuizRoomPublic } from '@rosco/shared';
import { getSocket } from '../socket';

interface AckResponse {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface QuizContextValue {
  room: QuizRoomPublic | null;
  ranking: QuizRankingEntry[] | null;
  playerId: string | null;
  roomError: string | null;
  setPlayerId: (id: string | null) => void;
  clearRoomError: () => void;
  emitWithAck: <T extends AckResponse>(event: string, payload: unknown) => Promise<T>;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<QuizRoomPublic | null>(null);
  const [ranking, setRanking] = useState<QuizRankingEntry[] | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onRoomState = (state: QuizRoomPublic) => setRoom(state);
    const onFinished = (payload: { ranking: QuizRankingEntry[] }) => setRanking(payload.ranking);
    const onRoomErrorEvt = (payload: { reason: string }) => setRoomError(payload.reason);

    socket.on('quiz:roomState', onRoomState);
    socket.on('quiz:gameFinished', onFinished);
    socket.on('quiz:roomError', onRoomErrorEvt);

    return () => {
      socket.off('quiz:roomState', onRoomState);
      socket.off('quiz:gameFinished', onFinished);
      socket.off('quiz:roomError', onRoomErrorEvt);
    };
  }, []);

  const setPlayerId = useCallback((id: string | null) => {
    playerIdRef.current = id;
    forceRender((n) => n + 1);
  }, []);

  const clearRoomError = useCallback(() => setRoomError(null), []);

  const emitWithAck = useCallback(<T extends AckResponse>(event: string, payload: unknown) => {
    return new Promise<T>((resolve, reject) => {
      const socket = getSocket();
      socket.emit(event, payload, (res: T) => {
        if (res?.ok) resolve(res);
        else reject(new Error(res?.reason || 'Error desconocido'));
      });
    });
  }, []);

  return (
    <QuizContext.Provider
      value={{
        room,
        ranking,
        playerId: playerIdRef.current,
        roomError,
        setPlayerId,
        clearRoomError,
        emitWithAck,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz debe usarse dentro de QuizProvider');
  return ctx;
}
