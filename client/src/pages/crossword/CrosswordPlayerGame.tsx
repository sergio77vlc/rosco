import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCrossword } from '../../context/CrosswordContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { loadSession } from '../../utils/session';
import { getSocket } from '../../socket';
import CrosswordBoard from '../../components/CrosswordBoard';
import CrosswordPodium from '../../components/CrosswordPodium';
import { fallbackCrosswordRanking } from '../../utils/crosswordRank';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../../constants';

export default function CrosswordPlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, ranking, emitWithAck, setPlayerId } = useCrossword();

  useRoomReconnect({
    code,
    prefix: 'crossword',
    hostReconnectEvent: 'crossword:hostReconnect',
    playerReconnectEvent: 'crossword:playerReconnect',
    emitWithAck,
    setPlayerId,
    onPlayerReconnectFailed: () => navigate(`/crossword/join/${code}`),
  });

  useEffect(() => {
    if (playerId || !code) return;
    const session = loadSession('crossword', code);
    if (!session?.playerId) navigate(`/crossword/join/${code}`);
  }, [playerId, code, navigate]);

  if (!room || !code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') {
    const finalRanking = ranking ?? fallbackCrosswordRanking(room.players);
    const myEntry = finalRanking.find((r) => r.playerId === playerId);
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">🏁 ¡Crucigrama completado!</h1>
        {myEntry && (
          <p className="app-subtitle">
            {myEntry.place === 1 ? '🏆 ¡Has ganado!' : `Quedaste en el puesto #${myEntry.place}.`}
          </p>
        )}
        <CrosswordPodium ranking={finalRanking} highlightPlayerId={playerId} />
      </div>
    );
  }

  if (room.status === 'lobby') {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Esperando a que el anfitrión empiece la partida...</p>
      </div>
    );
  }

  function handleFocus(clueId: string | null) {
    if (!code) return;
    // Aviso ligero de presencia (no espera respuesta): quién mira qué palabra ahora mismo.
    getSocket().emit('crossword:playerFocus', { code, clueId });
  }

  async function handleSubmit(clueId: string, answerText: string): Promise<boolean> {
    if (!code) return false;
    try {
      const res = await emitWithAck<{ ok: true; correct?: boolean }>('crossword:playerSubmitAnswer', {
        code,
        clueId,
        answerText,
      });
      return !!res.correct;
    } catch {
      return false;
    }
  }

  return (
    <div className="screen screen-center crossword-screen">
      <h1 className="screen-title">🧩 {room.puzzleTitle}</h1>
      <p className="app-subtitle">
        {DIFFICULTY_ICONS[room.difficulty]} {DIFFICULTY_LABELS[room.difficulty]} ·{' '}
        {room.clues.filter((c) => c.solved).length}/{room.clues.length} palabras resueltas
      </p>
      <CrosswordBoard room={room} myPlayerId={playerId} onFocus={handleFocus} onSubmit={handleSubmit} />
    </div>
  );
}
