import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import QuizHostLobby from './QuizHostLobby';
import QuizHostGame from './QuizHostGame';
import QuizHostResults from './QuizHostResults';

export default function QuizHostRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, emitWithAck, setPlayerId } = useQuiz();

  useRoomReconnect({
    code,
    prefix: 'quiz',
    hostReconnectEvent: 'quiz:hostReconnect',
    playerReconnectEvent: 'quiz:playerReconnect',
    emitWithAck,
    setPlayerId,
  });

  // Si el anfitrión también se unió como jugador, en cuanto empiece la partida
  // pasa a responder en su propia pantalla en vez de quedarse en el panel de TV.
  useEffect(() => {
    if (room && room.status !== 'lobby' && playerId) {
      navigate(`/quiz/play/${code}`);
    }
  }, [room, playerId, code, navigate]);

  if (!room || room.code !== code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
        <p className="app-subtitle">
          Si no aparece, vuelve a{' '}
          <a href="/quiz/host" className="link">
            crear la partida
          </a>
          . El anfitrión debe mantener esta pestaña abierta durante toda la partida.
        </p>
      </div>
    );
  }

  if (room.status === 'lobby') return <QuizHostLobby room={room} />;
  if (room.status === 'finished') return <QuizHostResults room={room} />;
  return <QuizHostGame room={room} />;
}
