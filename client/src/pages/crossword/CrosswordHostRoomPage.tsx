import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCrossword } from '../../context/CrosswordContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import CrosswordHostLobby from './CrosswordHostLobby';
import CrosswordHostGame from './CrosswordHostGame';
import CrosswordHostResults from './CrosswordHostResults';

export default function CrosswordHostRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, emitWithAck, setPlayerId } = useCrossword();

  useRoomReconnect({
    code,
    prefix: 'crossword',
    hostReconnectEvent: 'crossword:hostReconnect',
    playerReconnectEvent: 'crossword:playerReconnect',
    emitWithAck,
    setPlayerId,
  });

  // Si el anfitrión también se unió como jugador, en cuanto empiece la partida
  // pasa a su propio tablero en vez de quedarse en el panel de TV.
  useEffect(() => {
    if (room && room.status !== 'lobby' && playerId) {
      navigate(`/crossword/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  if (!room || room.code !== code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
        <p className="app-subtitle">
          Si no aparece, vuelve a{' '}
          <a href="/crossword/host" className="link">
            crear la partida
          </a>
          . El anfitrión debe mantener esta pestaña abierta durante toda la partida.
        </p>
      </div>
    );
  }

  if (room.status === 'lobby') return <CrosswordHostLobby room={room} />;

  if (playerId) {
    // El anfitrión también juega: nunca debe llegar a ver el panel de monitoreo, ni
    // siquiera un instante — se le redirige a su propio tablero (efecto de arriba).
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') return <CrosswordHostResults room={room} />;
  return <CrosswordHostGame room={room} />;
}
