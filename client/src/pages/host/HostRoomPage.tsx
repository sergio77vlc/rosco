import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import HostLobby from './HostLobby';
import HostGame from './HostGame';
import HostResults from './HostResults';

export default function HostRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, emitWithAck, setPlayerId } = useGame();

  useRoomReconnect({
    code,
    prefix: 'rosco',
    hostReconnectEvent: 'host:reconnect',
    playerReconnectEvent: 'player:reconnect',
    emitWithAck,
    setPlayerId,
  });

  // Si el anfitrión también se unió como jugador, en cuanto empiece la partida
  // pasa a jugar su propio rosco en vez de quedarse en el panel de espectador.
  useEffect(() => {
    if (room && room.status === 'playing' && playerId) {
      navigate(`/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  if (!room || room.code !== code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
        <p className="app-subtitle">
          Si no aparece, vuelve a{' '}
          <a href="/host" className="link">
            crear la partida
          </a>
          . El anfitrión debe mantener esta pestaña abierta durante toda la partida.
        </p>
      </div>
    );
  }

  if (room.status === 'lobby') return <HostLobby room={room} />;
  if (room.status === 'playing') return <HostGame room={room} />;
  return <HostResults room={room} />;
}
