import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_MII_CONFIG, type MiiConfig } from '@rosco/shared';
import MiiAvatar from '../../components/MiiAvatar';
import MiiEditor from '../../components/MiiEditor';
import { useBattle } from '../../context/BattleContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { saveSession } from '../../utils/session';

export default function BattleJoinLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, setPlayerId, emitWithAck } = useBattle();

  const [name, setName] = useState('');
  const [mii, setMii] = useState<MiiConfig>(DEFAULT_MII_CONFIG);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRoomReconnect({
    code,
    prefix: 'battle',
    hostReconnectEvent: 'battle:hostReconnect',
    playerReconnectEvent: 'battle:playerReconnect',
    emitWithAck,
    setPlayerId,
  });

  useEffect(() => {
    if (room && room.status !== 'lobby' && playerId) {
      navigate(`/battle/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      const res = await emitWithAck<{ ok: true; playerId: string }>('battle:playerJoinRoom', {
        code,
        name: name.trim() || 'Jugador',
        mii,
      });
      setPlayerId(res.playerId);
      saveSession('battle', code, { playerId: res.playerId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir a la partida.');
    } finally {
      setJoining(false);
    }
  }

  if (!playerId) {
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">Batalla {code}</h1>
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
          <MiiEditor value={mii} onChange={setMii} />
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-big" type="submit" disabled={joining}>
            {joining ? 'Entrando...' : '⚔️ Entrar a la batalla'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Batalla {code}</h1>
      <p className="app-subtitle">Esperando a que el anfitrión empiece la partida...</p>
      {room && !room.hostConnected && (
        <p className="host-disconnected-banner">⚠️ El anfitrión se ha desconectado. Esperando a que vuelva...</p>
      )}
      {room && (
        <div className="battle-lobby-players">
          {room.players.map((p) => (
            <div key={p.id} className="battle-lobby-player-badge">
              <MiiAvatar mii={p.mii} size={56} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
