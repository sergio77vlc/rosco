import React from 'react';
import type { MiiConfig } from '@rosco/shared';

interface MiiAvatarProps {
  mii: MiiConfig;
  size?: number;
  className?: string;
}

function Outfit({ style, color }: { style: MiiConfig['outfitStyle']; color: string }) {
  switch (style) {
    case 'sudadera':
      return (
        <g>
          <path d="M26,240 Q32,170 100,164 Q168,170 174,240 Z" fill={color} />
          <path d="M70,168 Q100,190 130,168 L124,178 Q100,196 76,178 Z" fill="#00000022" />
          <circle cx={82} cy={202} r={4} fill="#ffffff77" />
          <circle cx={118} cy={202} r={4} fill="#ffffff77" />
        </g>
      );
    case 'vestido':
      return (
        <g>
          <path d="M18,240 Q30,168 100,162 Q170,168 182,240 Z" fill={color} />
          <path d="M70,166 L100,186 L130,166 L124,176 L100,192 L76,176 Z" fill="#00000022" />
        </g>
      );
    case 'traje':
      return (
        <g>
          <path d="M28,240 Q34,172 100,166 Q166,172 172,240 Z" fill="#1f2937" />
          <path d="M85,172 L100,196 L115,172 L108,168 L100,178 L92,168 Z" fill="#fff" />
          <path d="M96,178 L104,178 L108,240 L92,240 Z" fill={color} />
        </g>
      );
    case 'camiseta':
    default:
      return <path d="M28,240 Q34,174 100,168 Q166,174 172,240 Z" fill={color} />;
  }
}

function HairBack({ style, color }: { style: MiiConfig['hairStyle']; color: string }) {
  if (style !== 'largo') return null;
  return (
    <path
      d="M42,100 Q34,150 40,205 Q50,222 60,208 Q52,160 62,110 Q100,90 138,110 Q148,160 140,208 Q150,222 160,205 Q166,150 158,100 Z"
      fill={color}
    />
  );
}

function HairFront({ style, color }: { style: MiiConfig['hairStyle']; color: string }) {
  switch (style) {
    case 'largo':
      return <path d="M44,96 Q38,40 100,30 Q162,40 156,96 Q150,64 100,58 Q50,64 44,96 Z" fill={color} />;
    case 'moicano':
      return (
        <g fill={color}>
          <path d="M92,12 L108,12 L112,64 L88,64 Z" />
          <path d="M46,90 Q42,68 60,66 Q56,80 50,92 Z" />
          <path d="M154,90 Q158,68 140,66 Q144,80 150,92 Z" />
        </g>
      );
    case 'rizado':
      return (
        <g fill={color}>
          <circle cx={50} cy={70} r={14} />
          <circle cx={66} cy={50} r={15} />
          <circle cx={86} cy={38} r={16} />
          <circle cx={114} cy={38} r={16} />
          <circle cx={134} cy={50} r={15} />
          <circle cx={150} cy={70} r={14} />
          <circle cx={100} cy={34} r={17} />
        </g>
      );
    case 'gorra':
      return (
        <g>
          <path d="M42,84 Q38,42 100,34 Q162,42 158,84 Q150,58 100,52 Q50,58 42,84 Z" fill={color} />
          <path d="M40,78 Q100,58 160,78 L172,92 Q100,72 28,92 Z" fill={color} opacity={0.85} />
        </g>
      );
    case 'corto':
    default:
      return <path d="M46,92 Q40,50 100,42 Q160,50 154,92 Q150,66 100,60 Q50,66 46,92 Z" fill={color} />;
  }
}

function DefaultFace({ skinTone }: { skinTone: string }) {
  return (
    <g>
      <ellipse cx={100} cy={100} rx={54} ry={58} fill={skinTone} />
      <circle cx={80} cy={100} r={6} fill="#3a2a5c" />
      <circle cx={120} cy={100} r={6} fill="#3a2a5c" />
      <path d="M86,124 Q100,134 114,124" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />
      <ellipse cx={70} cy={116} rx={9} ry={5.5} fill="#ff9eb8" opacity={0.5} />
      <ellipse cx={130} cy={116} rx={9} ry={5.5} fill="#ff9eb8" opacity={0.5} />
    </g>
  );
}

export default function MiiAvatar({ mii, size = 140, className }: MiiAvatarProps) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={(size * 240) / 200}
      className={`mii-avatar-svg ${className ?? ''}`}
      role="img"
      aria-label="Personaje"
    >
      <HairBack style={mii.hairStyle} color={mii.hairColor} />
      <Outfit style={mii.outfitStyle} color={mii.outfitColor} />

      {mii.photo ? (
        <>
          <defs>
            <clipPath id={`mii-face-clip-${uid}`}>
              <ellipse cx={100} cy={100} rx={54} ry={58} />
            </clipPath>
          </defs>
          <image
            href={mii.photo}
            x={40}
            y={40}
            width={120}
            height={120}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#mii-face-clip-${uid})`}
          />
        </>
      ) : (
        <DefaultFace skinTone={mii.skinTone} />
      )}

      <HairFront style={mii.hairStyle} color={mii.hairColor} />
    </svg>
  );
}
