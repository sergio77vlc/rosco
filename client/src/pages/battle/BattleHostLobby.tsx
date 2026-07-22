import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { BattleRoomPublic } from '@rosco/shared';
import MiiAvatar from '../../components/MiiAvatar';
import { useBattle } from '../../context/BattleContext';
import { QUIZ_DIFFICULTY_ICONS, QUIZ_DIFFICULTY_LABELS } from '../../constants';

const MIN_PLAYERS = 2;

interface BattleHostLobbyProps {
  room: BattleRoomPublic;
}

export default function BattleHostLobby({ room }: BattleHostLobbyProps) {
  const { emitWithAck } = useBattle();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `${window.location.origin}/battle/join/${room.code}`;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await emitWithAck('battle:hostStartGame', { code: room.code });
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
      <p className="app-subtitle">
        {QUIZ_DIFFICULTY_ICONS[room.difficulty]} {QUIZ_DIFFICULTY_LABELS[room.difficulty]} · mínimo {MIN_PLAYERS}{' '}
        jugadores
      </p>

      <div className="lobby-code-block">
        <div className="qr-wrap">
          <QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#1b1035" />
        </div>
        <div className="room-code">{room.code}</div>
      </div>

      <h2 className="lobby-players-title">
        Jugadores ({room.players.length}/{room.maxPlayers})
      </h2>
      <div className="battle-lobby-players">
        {room.players.length === 0 && <p className="app-subtitle">Esperando a que se unan jugadores...</p>}
        {room.players.map((p) => (
          <div key={p.id} className="battle-lobby-player-badge">
            <MiiAvatar mii={p.mii} size={56} />
            <span>{p.name}</span>
          </div>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        className="btn btn-primary btn-big"
        onClick={handleStart}
        disabled={starting || room.players.length < MIN_PLAYERS}
      >
        {starting
          ? 'Empezando...'
          : room.players.length < MIN_PLAYERS
            ? `Esperando ${MIN_PLAYERS - room.players.length} jugador${MIN_PLAYERS - room.players.length === 1 ? '' : 'es'} más`
            : '⚔️ Empezar batalla'}
      </button>
    </div>
  );
}
