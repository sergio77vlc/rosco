import React from 'react';

interface PlayerBadgeProps {
  name: string;
  color: string;
  connected?: boolean;
  subtitle?: string;
}

export default function PlayerBadge({ name, color, connected = true, subtitle }: PlayerBadgeProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={`player-badge ${connected ? '' : 'player-badge-disconnected'}`}>
      <div className="player-badge-avatar" style={{ backgroundColor: color }}>
        {initial}
      </div>
      <div className="player-badge-info">
        <span className="player-badge-name">{name}</span>
        {subtitle && <span className="player-badge-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
