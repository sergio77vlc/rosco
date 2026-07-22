import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CrosswordRoomPublic } from '@rosco/shared';
import { useCrossword } from '../../context/CrosswordContext';
import CrosswordPodium from '../../components/CrosswordPodium';
import { fallbackCrosswordRanking } from '../../utils/crosswordRank';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../../constants';

interface CrosswordHostResultsProps {
  room: CrosswordRoomPublic;
}

export default function CrosswordHostResults({ room }: CrosswordHostResultsProps) {
  const navigate = useNavigate();
  const { ranking } = useCrossword();
  const finalRanking = ranking ?? fallbackCrosswordRanking(room.players);

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">🏁 ¡Crucigrama completado!</h1>
      <h2 className="app-subtitle">
        🧩 {room.puzzleTitle} · {DIFFICULTY_ICONS[room.difficulty]} {DIFFICULTY_LABELS[room.difficulty]}
      </h2>

      <CrosswordPodium ranking={finalRanking} />

      <button className="btn btn-primary btn-big" onClick={() => navigate('/crossword/host')}>
        🔁 Nueva partida
      </button>
    </div>
  );
}
