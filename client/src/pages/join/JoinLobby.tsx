import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PLAYER_COLORS } from '@rosco/shared';
import PlayerBadge from '../../components/PlayerBadge';
import { useGame } from '../../context/GameContext';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

export default function JoinLobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, setPlayerId, emitWithAck } = useGame();
  const tts = useSpeechSynthesis();

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PLAYER_COLORS[0]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        color,
      });
      setPlayerId(res.playerId);
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
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-big" type="submit" disabled={joining}>
            {joining ? 'Entrando...' : 'Entrar a la sala'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Sala {code}</h1>
      <p className="app-subtitle">Esperando a que el anfitrión empiece la partida...</p>
      {room && (
        <div className="lobby-players-list">
          {room.players.map((p) => (
            <PlayerBadge key={p.id} name={p.name} color={p.color} connected={p.connected} />
          ))}
        </div>
      )}
    </div>
  );
}
