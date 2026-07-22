import React from 'react';
import { BATTLE_START_HP } from '@rosco/shared';

interface HpBarProps {
  hp: number;
  maxHp?: number;
  className?: string;
}

export default function HpBar({ hp, maxHp = BATTLE_START_HP, className }: HpBarProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const level = pct > 50 ? 'high' : pct > 20 ? 'mid' : 'low';
  return (
    <div className={`hp-bar ${className ?? ''}`}>
      <div className={`hp-bar-fill hp-bar-fill-${level}`} style={{ width: `${pct}%` }} />
      <span className="hp-bar-label">
        ❤️ {hp}/{maxHp}
      </span>
    </div>
  );
}
