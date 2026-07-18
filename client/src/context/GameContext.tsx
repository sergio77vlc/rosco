import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { RankingEntry, RoomPublic } from '@rosco/shared';
import { getSocket } from '../socket';

interface AckResponse {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface GameContextValue {
  room: RoomPublic | null;
  ranking: RankingEntry[] | null;
  playerId: string | null;
  roomError: string | null;
  setPlayerId: (id: string | null) => void;
  clearRoomError: () => void;
  emitWithAck: <T extends AckResponse>(event: string, payload: unknown) => Promise<T>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onRoomState = (state: RoomPublic) => setRoom(state);
    const onFinished = (payload: { ranking: RankingEntry[] }) => setRanking(payload.ranking);
    const onRoomErrorEvt = (payload: { reason: string }) => setRoomError(payload.reason);

    socket.on('room:state', onRoomState);
    socket.on('game:finished', onFinished);
    socket.on('room:error', onRoomErrorEvt);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('game:finished', onFinished);
      socket.off('room:error', onRoomErrorEvt);
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
    <GameContext.Provider
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
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de GameProvider');
  return ctx;
}
