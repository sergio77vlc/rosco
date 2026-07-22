import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { BattleRankingEntry, BattleRoomPublic } from '@rosco/shared';
import { getSocket } from '../socket';

interface AckResponse {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface BattleContextValue {
  room: BattleRoomPublic | null;
  ranking: BattleRankingEntry[] | null;
  playerId: string | null;
  roomError: string | null;
  setPlayerId: (id: string | null) => void;
  clearRoomError: () => void;
  emitWithAck: <T extends AckResponse>(event: string, payload: unknown) => Promise<T>;
}

const BattleContext = createContext<BattleContextValue | null>(null);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<BattleRoomPublic | null>(null);
  const [ranking, setRanking] = useState<BattleRankingEntry[] | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onRoomState = (state: BattleRoomPublic) => setRoom(state);
    const onFinished = (payload: { ranking: BattleRankingEntry[] }) => setRanking(payload.ranking);
    const onRoomErrorEvt = (payload: { reason: string }) => setRoomError(payload.reason);

    socket.on('battle:roomState', onRoomState);
    socket.on('battle:gameFinished', onFinished);
    socket.on('battle:roomError', onRoomErrorEvt);

    return () => {
      socket.off('battle:roomState', onRoomState);
      socket.off('battle:gameFinished', onFinished);
      socket.off('battle:roomError', onRoomErrorEvt);
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
    <BattleContext.Provider
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
    </BattleContext.Provider>
  );
}

export function useBattle(): BattleContextValue {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error('useBattle debe usarse dentro de BattleProvider');
  return ctx;
}
