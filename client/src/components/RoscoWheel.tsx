import React, { useMemo } from 'react';
import type { LetterState, PlayerProgressEntry } from '@rosco/shared';

interface RoscoWheelLetter {
  letter: string;
}

interface RoscoWheelProps {
  letters: RoscoWheelLetter[];
  progress: PlayerProgressEntry[];
  size?: number;
}

const STATE_COLORS: Record<LetterState, { fill: string; text: string }> = {
  pending: { fill: '#2c2440', text: '#c9bfe0' },
  active: { fill: '#facc15', text: '#1b1035' },
  correct: { fill: '#22c55e', text: '#08240f' },
  wrong: { fill: '#ef4444', text: '#2a0505' },
  passed: { fill: '#f97316', text: '#2a1400' },
};

export default function RoscoWheel({ letters, progress, size = 320 }: RoscoWheelProps) {
  const tiles = useMemo(() => {
    const n = letters.length;
    const radius = size * 0.4;
    const center = size / 2;
    const tileRadius = size * 0.058;
    return letters.map((l, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const state: LetterState = progress[i]?.state ?? 'pending';
      return { letter: l.letter, x, y, state, key: `${l.letter}-${i}` };
    });
  }, [letters, progress, size]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rosco-wheel">
      {tiles.map((tile) => {
        const colors = STATE_COLORS[tile.state];
        const isActive = tile.state === 'active';
        return (
          <g key={tile.key}>
            <circle
              cx={tile.x}
              cy={tile.y}
              r={size * 0.058}
              fill={colors.fill}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isActive ? 3 : 1}
              className={isActive ? 'rosco-tile-active' : undefined}
            />
            <text
              x={tile.x}
              y={tile.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.048}
              fontWeight={700}
              fill={colors.text}
            >
              {tile.letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
