import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleRoomPublic } from '@rosco/shared';
import { useBattle } from '../../context/BattleContext';
import BattlePodium from '../../components/BattlePodium';
import { fallbackBattleRanking } from '../../utils/battleRank';

interface BattleHostResultsProps {
  room: BattleRoomPublic;
}

export default function BattleHostResults({ room }: BattleHostResultsProps) {
  const navigate = useNavigate();
  const { ranking } = useBattle();
  const finalRanking = ranking ?? fallbackBattleRanking(room.players);

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">🏁 ¡Fin de la batalla!</h1>
      {finalRanking[0] && <p className="app-subtitle">🏆 {finalRanking[0].name} ha ganado la batalla</p>}

      <BattlePodium ranking={finalRanking} />

      <button className="btn btn-primary btn-big" onClick={() => navigate('/battle/host')}>
        🔁 Nueva batalla
      </button>
    </div>
  );
}
