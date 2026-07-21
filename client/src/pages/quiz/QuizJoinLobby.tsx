import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_AVATAR, PLAYER_COLORS } from '@rosco/shared';
import PlayerBadge from '../../components/PlayerBadge';
import AvatarPicker from '../../components/AvatarPicker';
import { useQuiz } from '../../context/QuizContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { saveSession } from '../../utils/session';

export default function QuizJoinLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, setPlayerId, emitWithAck } = useQuiz();

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PLAYER_COLORS[0]);
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRoomReconnect({
    code,
    prefix: 'quiz',
    hostReconnectEvent: 'quiz:hostReconnect',
    playerReconnectEvent: 'quiz:playerReconnect',
    emitWithAck,
    setPlayerId,
  });

  useEffect(() => {
    if (room && room.status !== 'lobby' && playerId) {
      navigate(`/quiz/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      const res = await emitWithAck<{ ok: true; playerId: string }>('quiz:playerJoinRoom', {
        code,
        name: name.trim() || 'Jugador',
        color,
        avatar,
      });
      setPlayerId(res.playerId);
      saveSession('quiz', code, { playerId: res.playerId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir a la partida.');
    } finally {
      setJoining(false);
    }
  }

  if (!playerId) {
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">Quiz {code}</h1>
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
          <div className="color-picker">
            {PLAYER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${color === c ? 'color-swatch-active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Elegir color ${c}`}
              />
            ))}
          </div>
          <AvatarPicker value={avatar} color={color} onChange={setAvatar} />
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-big" type="submit" disabled={joining}>
            {joining ? 'Entrando...' : '🚀 Entrar al quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Quiz {code}</h1>
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
