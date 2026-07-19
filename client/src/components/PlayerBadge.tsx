import React from 'react';
import AvatarView from './AvatarView';

interface PlayerBadgeProps {
  name: string;
  color: string;
  avatar?: string;
  connected?: boolean;
  subtitle?: string;
  size?: number;
}

export default function PlayerBadge({ name, color, avatar, connected = true, subtitle, size = 34 }: PlayerBadgeProps) {
  return (
    <div className={`player-badge ${connected ? '' : 'player-badge-disconnected'}`}>
      <AvatarView avatar={avatar || name.trim().charAt(0).toUpperCase() || '?'} color={color} size={size} />
      <div className="player-badge-info">
        <span className="player-badge-name">{name}</span>
        {subtitle && <span className="player-badge-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
