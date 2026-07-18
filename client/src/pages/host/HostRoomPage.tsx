import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import HostLobby from './HostLobby';
import HostGame from './HostGame';
import HostResults from './HostResults';

export default function HostRoomPage() {
  const { code } = useParams<{ code: string }>();
  const { room } = useGame();

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
