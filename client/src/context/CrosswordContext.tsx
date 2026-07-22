import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { CrosswordRankingEntry, CrosswordRoomPublic } from '@rosco/shared';
import { getSocket } from '../socket';

interface AckResponse {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface CrosswordContextValue {
  room: CrosswordRoomPublic | null;
  ranking: CrosswordRankingEntry[] | null;
  playerId: string | null;
  roomError: string | null;
  setPlayerId: (id: string | null) => void;
  clearRoomError: () => void;
  emitWithAck: <T extends AckResponse>(event: string, payload: unknown) => Promise<T>;
}

const CrosswordContext = createContext<CrosswordContextValue | null>(null);

export function CrosswordProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<CrosswordRoomPublic | null>(null);
  const [ranking, setRanking] = useState<CrosswordRankingEntry[] | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onRoomState = (state: CrosswordRoomPublic) => setRoom(state);
    const onFinished = (payload: { ranking: CrosswordRankingEntry[] }) => setRanking(payload.ranking);
    const onRoomErrorEvt = (payload: { reason: string }) => setRoomError(payload.reason);

    socket.on('crossword:roomState', onRoomState);
    socket.on('crossword:gameFinished', onFinished);
    socket.on('crossword:roomError', onRoomErrorEvt);

    return () => {
      socket.off('crossword:roomState', onRoomState);
      socket.off('crossword:gameFinished', onFinished);
      socket.off('crossword:roomError', onRoomErrorEvt);
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
    <CrosswordContext.Provider
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
    </CrosswordContext.Provider>
  );
}

export function useCrossword(): CrosswordContextValue {
  const ctx = useContext(CrosswordContext);
  if (!ctx) throw new Error('useCrossword debe usarse dentro de CrosswordProvider');
  return ctx;
}
