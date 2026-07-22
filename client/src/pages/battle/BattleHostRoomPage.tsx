import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBattle } from '../../context/BattleContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import BattleHostLobby from './BattleHostLobby';
import BattleHostGame from './BattleHostGame';
import BattleHostResults from './BattleHostResults';

export default function BattleHostRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, emitWithAck, setPlayerId } = useBattle();

  useRoomReconnect({
    code,
    prefix: 'battle',
    hostReconnectEvent: 'battle:hostReconnect',
    playerReconnectEvent: 'battle:playerReconnect',
    emitWithAck,
    setPlayerId,
  });

  // Si el anfitrión también se unió como jugador, en cuanto empiece la partida
  // pasa a su propia pantalla de juego en vez de quedarse en el panel de TV.
  useEffect(() => {
    if (room && room.status !== 'lobby' && playerId) {
      navigate(`/battle/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  if (!room || room.code !== code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
        <p className="app-subtitle">
          Si no aparece, vuelve a{' '}
          <a href="/battle/host" className="link">
            crear la partida
          </a>
          . El anfitrión debe mantener esta pestaña abierta durante toda la partida.
        </p>
      </div>
    );
  }

  if (room.status === 'lobby') return <BattleHostLobby room={room} />;

  if (playerId) {
    // El anfitrión también juega: nunca debe llegar a ver el panel de monitoreo, ni
    // siquiera un instante — se le redirige a su propia pantalla de juego (efecto de arriba).
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') return <BattleHostResults room={room} />;
  return <BattleHostGame room={room} />;
}
