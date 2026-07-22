import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_AVATAR, DEFAULT_PLAYER_COLOR } from '@rosco/shared';
import PlayerBadge from '../../components/PlayerBadge';
import AvatarPicker from '../../components/AvatarPicker';
import { useGame } from '../../context/GameContext';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { saveSession } from '../../utils/session';

export default function JoinLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, setPlayerId, emitWithAck } = useGame();
  const tts = useSpeechSynthesis();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRoomReconnect({
    code,
    prefix: 'rosco',
    hostReconnectEvent: 'host:reconnect',
    playerReconnectEvent: 'player:reconnect',
    emitWithAck,
    setPlayerId,
  });

  useEffect(() => {
    if (room && room.status === 'playing' && playerId) {
      navigate(`/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    tts.prime();
    setJoining(true);
    setError(null);
    try {
      const res = await emitWithAck<{ ok: true; playerId: string }>('player:joinRoom', {
        code,
        name: name.trim() || 'Jugador',
        color: DEFAULT_PLAYER_COLOR,
        avatar,
      });
      setPlayerId(res.playerId);
      saveSession('rosco', code, { playerId: res.playerId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir a la partida.');
    } finally {
      setJoining(false);
    }
  }

  if (!playerId) {
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">Sala {code}</h1>
        <form className="join-form" onSubmit={handleJoin}>
          <label>
            Tu nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              maxLength={20}
              autoFocus
            />
          </label>
          <AvatarPicker value={avatar} onChange={setAvatar} />
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-big" type="submit" disabled={joining}>
            {joining ? 'Entrando...' : '🚀 Entrar a la sala'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Sala {code}</h1>
      <p className="app-subtitle">Esperando a que el anfitrión empiece la partida...</p>
      {room && !room.hostConnected && (
        <p className="host-disconnected-banner">⚠️ El anfitrión se ha desconectado. Esperando a que vuelva...</p>
      )}
      {room && (
        <div className="lobby-players-list">
          {room.players.map((p) => (
            <PlayerBadge key={p.id} name={p.name} color={p.color} avatar={p.avatar} connected={p.connected} />
          ))}
        </div>
      )}
    </div>
  );
}
