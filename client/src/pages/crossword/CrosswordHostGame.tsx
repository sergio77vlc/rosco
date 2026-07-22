import React from 'react';
import type { CrosswordRoomPublic } from '@rosco/shared';
import CrosswordBoard from '../../components/CrosswordBoard';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../../constants';

interface CrosswordHostGameProps {
  room: CrosswordRoomPublic;
}

/** Panel de monitorización (modo TV): el anfitrión ve el mismo tablero en directo, sin poder
 * responder — solo juega quien se ha unido como jugador. */
export default function CrosswordHostGame({ room }: CrosswordHostGameProps) {
  return (
    <div className="screen screen-center crossword-screen">
      <h1 className="screen-title">🧩 {room.puzzleTitle}</h1>
      <p className="app-subtitle">
        {DIFFICULTY_ICONS[room.difficulty]} {DIFFICULTY_LABELS[room.difficulty]} ·{' '}
        {room.clues.filter((c) => c.solved).length}/{room.clues.length} palabras resueltas
      </p>
      <CrosswordBoard room={room} myPlayerId={null} />
    </div>
  );
}
