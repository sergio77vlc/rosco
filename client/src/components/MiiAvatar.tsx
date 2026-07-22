import React from 'react';
import type { MiiConfig, MiiExpression } from '@rosco/shared';

interface MiiAvatarProps {
  mii: MiiConfig;
  /** Expresión facial a mostrar (no se guarda en el perfil, la decide quien renderiza el personaje). */
  expression?: MiiExpression;
  size?: number;
  className?: string;
}

// Viewbox de cuerpo entero: cabeza igual que antes (centrada en 100,100) más torso, brazos y
// piernas debajo, pensado en proporciones "chibi" para que se lea bien incluso en miniatura.
const VIEW_W = 200;
const VIEW_H = 330;

function shade(color: string, amount: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const num = parseInt(hex, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((num >> 16) & 0xff) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function Legs({ outfitStyle, pantsColor }: { outfitStyle: MiiConfig['outfitStyle']; pantsColor: string }) {
  const shoeColor = '#2b2b2b';
  // El vestido tapa los muslos: las piernas asoman más cortas, desde la rodilla.
  const hipY = outfitStyle === 'vestido' ? 275 : 240;
  return (
    <>
      <g data-limb="leg-left">
        <path d={`M78,${hipY} L74,308`} stroke={pantsColor} strokeWidth={30} strokeLinecap="round" fill="none" />
        <ellipse cx={72} cy={314} rx={17} ry={10} fill={shoeColor} />
      </g>
      <g data-limb="leg-right">
        <path d={`M122,${hipY} L126,308`} stroke={pantsColor} strokeWidth={30} strokeLinecap="round" fill="none" />
        <ellipse cx={128} cy={314} rx={17} ry={10} fill={shoeColor} />
      </g>
    </>
  );
}

function Arms({ outfitStyle, outfitColor, skinTone }: { outfitStyle: MiiConfig['outfitStyle']; outfitColor: string; skinTone: string }) {
  const sleeveColor = outfitStyle === 'traje' ? '#1f2937' : outfitColor;
  return (
    <>
      <g data-limb="arm-left">
        <path d="M40,182 Q18,206 24,238" stroke={sleeveColor} strokeWidth={20} strokeLinecap="round" fill="none" />
        <circle cx={24} cy={241} r={11} fill={skinTone} />
      </g>
      <g data-limb="arm-right">
        <path d="M160,182 Q182,206 176,238" stroke={sleeveColor} strokeWidth={20} strokeLinecap="round" fill="none" />
        <circle cx={176} cy={241} r={11} fill={skinTone} />
      </g>
    </>
  );
}

function Outfit({ style, color }: { style: MiiConfig['outfitStyle']; color: string }) {
  switch (style) {
    case 'sudadera':
      return (
        <g>
          <path d="M30,245 Q36,170 100,164 Q164,170 170,245 Z" fill={color} />
          <path d="M70,168 Q100,190 130,168 L124,178 Q100,196 76,178 Z" fill="#00000022" />
          <circle cx={82} cy={202} r={4} fill="#ffffff77" />
          <circle cx={118} cy={202} r={4} fill="#ffffff77" />
        </g>
      );
    case 'vestido':
      return (
        <g>
          <path d="M22,280 Q30,168 100,162 Q170,168 178,280 Z" fill={color} />
          <path d="M70,166 L100,186 L130,166 L124,176 L100,192 L76,176 Z" fill="#00000022" />
          <path d="M22,280 Q100,296 178,280 L174,268 Q100,282 26,268 Z" fill={shade(color, -18)} />
        </g>
      );
    case 'traje':
      return (
        <g>
          <path d="M32,245 Q38,172 100,166 Q162,172 168,245 Z" fill="#1f2937" />
          <path d="M85,172 L100,196 L115,172 L108,168 L100,178 L92,168 Z" fill="#fff" />
          <path d="M96,178 L104,178 L108,245 L92,245 Z" fill={color} />
        </g>
      );
    case 'camiseta':
    default:
      return <path d="M32,245 Q38,174 100,168 Q162,174 168,245 Z" fill={color} />;
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

const INK = '#3a2a5c';

function Face({ skinTone, expression }: { skinTone: string; expression: MiiExpression }) {
  return (
    <g>
      <ellipse cx={100} cy={100} rx={54} ry={58} fill={skinTone} />
      <FaceFeatures expression={expression} />
    </g>
  );
}

function FaceFeatures({ expression }: { expression: MiiExpression }) {
  switch (expression) {
    case 'feliz':
      return (
        <g>
          <path d="M70,98 Q80,88 90,98" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          <path d="M110,98 Q120,88 130,98" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          <path d="M82,120 Q100,140 118,120" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
          <ellipse cx={70} cy={116} rx={10} ry={6} fill="#ff9eb8" opacity={0.6} />
          <ellipse cx={130} cy={116} rx={10} ry={6} fill="#ff9eb8" opacity={0.6} />
        </g>
      );
    case 'enfadado':
      return (
        <g>
          <path d="M70,90 L92,98" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M130,90 L108,98" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <circle cx={80} cy={104} r={5.5} fill={INK} />
          <circle cx={120} cy={104} r={5.5} fill={INK} />
          <path d="M84,128 Q100,120 116,128" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
        </g>
      );
    case 'sorprendido':
      return (
        <g>
          <path d="M70,90 Q80,84 90,90" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M110,90 Q120,84 130,90" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={80} cy={102} r={8} fill="#fff" stroke={INK} strokeWidth={2.4} />
          <circle cx={120} cy={102} r={8} fill="#fff" stroke={INK} strokeWidth={2.4} />
          <circle cx={80} cy={102} r={3.4} fill={INK} />
          <circle cx={120} cy={102} r={3.4} fill={INK} />
          <ellipse cx={100} cy={128} rx={9} ry={11} fill={INK} opacity={0.85} />
        </g>
      );
    case 'dolor':
      return (
        <g stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none">
          <path d="M72,94 L88,104" />
          <path d="M88,94 L72,104" />
          <path d="M112,94 L128,104" />
          <path d="M128,94 L112,104" />
          <path d="M84,126 Q92,120 100,126 Q108,132 116,126" />
        </g>
      );
    case 'ko':
      return (
        <g stroke={INK} strokeWidth={3.4} strokeLinecap="round" fill="none">
          <path d="M70,92 L92,110" />
          <path d="M92,92 L70,110" />
          <path d="M108,92 L130,110" />
          <path d="M130,92 L108,110" />
          <path d="M86,128 Q100,124 114,128" />
        </g>
      );
    case 'neutral':
    default:
      return (
        <g>
          <circle cx={80} cy={100} r={6} fill={INK} />
          <circle cx={120} cy={100} r={6} fill={INK} />
          <path d="M86,124 Q100,134 114,124" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
          <ellipse cx={70} cy={116} rx={9} ry={5.5} fill="#ff9eb8" opacity={0.5} />
          <ellipse cx={130} cy={116} rx={9} ry={5.5} fill="#ff9eb8" opacity={0.5} />
        </g>
      );
  }
}

export default function MiiAvatar({ mii, expression = 'neutral', size = 140, className }: MiiAvatarProps) {
  const uid = React.useId().replace(/:/g, '');
  const pantsColor = mii.pantsColor ?? '#1f2937';
  const height = (size * VIEW_H) / VIEW_W;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={height}
      style={{ width: size, height, flexShrink: 0 }}
      className={`mii-avatar-svg ${className ?? ''}`}
      role="img"
      aria-label="Personaje"
    >
      <HairBack style={mii.hairStyle} color={mii.hairColor} />
      <Legs outfitStyle={mii.outfitStyle} pantsColor={pantsColor} />
      <Outfit style={mii.outfitStyle} color={mii.outfitColor} />
      <Arms outfitStyle={mii.outfitStyle} outfitColor={mii.outfitColor} skinTone={mii.skinTone} />

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
        <Face skinTone={mii.skinTone} expression={expression} />
      )}

      <HairFront style={mii.hairStyle} color={mii.hairColor} />
    </svg>
  );
}
