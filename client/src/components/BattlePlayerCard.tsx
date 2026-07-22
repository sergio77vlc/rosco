import React from 'react';
import type { MiiConfig } from '@rosco/shared';
import MiiAvatar from './MiiAvatar';
import HpBar from './HpBar';

/** Datos mínimos para pintar la tarjeta: tanto BattlePlayerPublic (partidas en red) como el
 * estado del modo local satisfacen esta forma. */
export interface BattlePlayerCardData {
  id: string;
  name: string;
  mii: MiiConfig;
  hp: number;
  alive: boolean;
}

interface BattlePlayerCardProps {
  player: BattlePlayerCardData;
  isActive?: boolean;
  isTarget?: boolean;
  size?: number;
  compact?: boolean;
  onClick?: () => void;
}

export default function BattlePlayerCard({ player, isActive, isTarget, size = 64, compact, onClick }: BattlePlayerCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`battle-player-card ${isActive ? 'battle-player-card-active' : ''} ${
        !player.alive ? 'battle-player-card-defeated' : ''
      } ${compact ? 'battle-player-card-compact' : ''} ${isTarget ? 'battle-player-card-target' : ''}`}
      onClick={onClick}
    >
      <MiiAvatar mii={player.mii} size={size} />
      <span className="battle-player-card-name">
        {player.name}
        {!player.alive ? ' 💀' : ''}
      </span>
      <HpBar hp={player.hp} />
    </Tag>
  );
}
