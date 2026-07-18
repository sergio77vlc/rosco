import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { RoomPublic } from '@rosco/shared';
import PlayerBadge from '../../components/PlayerBadge';
import { useGame } from '../../context/GameContext';

interface HostLobbyProps {
  room: RoomPublic;
}

export default function HostLobby({ room }: HostLobbyProps) {
  const { emitWithAck } = useGame();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `${window.location.origin}/join/${room.code}`;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await emitWithAck('host:startGame', { code: room.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo empezar la partida.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Sala de espera</h1>
      <p className="app-subtitle">Escanea el código QR o entra el código en cualquier móvil.</p>

      <div className="lobby-code-block">
        <div className="qr-wrap">
          <QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#1b1035" />
        </div>
        <div className="room-code">{room.code}</div>
      </div>

      <h2 className="lobby-players-title">
        Jugadores ({room.players.length}/{room.maxPlayers})
      </h2>
      <div className="lobby-players-list">
        {room.players.length === 0 && <p className="app-subtitle">Esperando a que se unan jugadores...</p>}
        {room.players.map((p) => (
          <PlayerBadge key={p.id} name={p.name} color={p.color} connected={p.connected} />
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        className="btn btn-primary btn-big"
        onClick={handleStart}
        disabled={starting || room.players.length === 0}
      >
        {starting ? 'Empezando...' : 'Empezar partida'}
      </button>
    </div>
  );
}
