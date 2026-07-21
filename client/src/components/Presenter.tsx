import React, { useEffect, useRef, useState } from 'react';

export type PresenterExpression = 'neutral' | 'happy' | 'sad';

interface PresenterProps {
  expression?: PresenterExpression;
  speaking?: boolean;
  size?: number;
  className?: string;
}

const HAIR_DARK = '#7c4fe0';
const HAIR_LIGHT = '#a78bfa';
const SKIN = '#ffe0c2';
const BLUSH = '#ff9eb8';
const IRIS = '#ff6f91';
const BLAZER = '#2c1c52';
const BLAZER_LIGHT = '#3d275f';
const ACCENT = '#facc15';

/** Marcos de boca mientras habla (se van alternando para simular que mueve los labios). */
const TALK_MOUTHS = [
  'M82,132 Q100,138 118,132 Q100,136 82,132 Z',
  'M80,129 Q100,148 120,129 Q100,142 80,129 Z',
  'M83,130 Q100,143 117,130 Q100,140 83,130 Z',
];

function EyesAndBrows({ expression }: { expression: PresenterExpression }) {
  if (expression === 'happy') {
    return (
      <g>
        <path d="M64,96 Q78,80 92,96" fill="none" stroke="#3a2a5c" strokeWidth={5} strokeLinecap="round" />
        <path d="M108,96 Q122,80 136,96" fill="none" stroke="#3a2a5c" strokeWidth={5} strokeLinecap="round" />
        <path d="M67,72 Q78,66 89,71" fill="none" stroke="#3a2a5c" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        <path d="M111,71 Q122,66 133,72" fill="none" stroke="#3a2a5c" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  }
  if (expression === 'sad') {
    return (
      <g>
        <ellipse cx={78} cy={99} rx={13} ry={15} fill="#fff" transform="rotate(-6 78 99)" />
        <ellipse cx={122} cy={99} rx={13} ry={15} fill="#fff" transform="rotate(6 122 99)" />
        <circle cx={80} cy={103} r={7.5} fill={IRIS} />
        <circle cx={124} cy={103} r={7.5} fill={IRIS} />
        <circle cx={82.5} cy={100} r={2.2} fill="#fff" />
        <circle cx={126.5} cy={100} r={2.2} fill="#fff" />
        <path d="M68,80 Q78,86 90,82" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />
        <path d="M110,82 Q122,86 132,80" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />
        <path d="M60,95 q4,10 -1,16" fill="#7ec8e3" opacity={0.85} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={78} cy={96} rx={14} ry={16.5} fill="#fff" />
      <ellipse cx={122} cy={96} rx={14} ry={16.5} fill="#fff" />
      <circle cx={78} cy={99} r={9} fill={IRIS} />
      <circle cx={122} cy={99} r={9} fill={IRIS} />
      <circle cx={78} cy={99} r={4} fill="#3a1030" />
      <circle cx={122} cy={99} r={4} fill="#3a1030" />
      <circle cx={81} cy={94.5} r={2.6} fill="#fff" />
      <circle cx={125} cy={94.5} r={2.6} fill="#fff" />
      <path d="M67,80 Q78,74 90,79" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />
      <path d="M110,79 Q122,74 133,80" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />
    </g>
  );
}

function IdleMouth({ expression }: { expression: PresenterExpression }) {
  if (expression === 'happy') {
    return <path d="M78,128 Q100,150 122,128 Q100,140 78,128 Z" fill="#8a3b52" stroke="#3a2a5c" strokeWidth={1.5} />;
  }
  if (expression === 'sad') {
    return <path d="M84,136 Q100,126 116,136" fill="none" stroke="#3a2a5c" strokeWidth={3.4} strokeLinecap="round" />;
  }
  return <path d="M86,130 Q100,138 114,130" fill="none" stroke="#3a2a5c" strokeWidth={3.2} strokeLinecap="round" />;
}

export default function Presenter({ expression = 'neutral', speaking = false, size = 180, className }: PresenterProps) {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [blink, setBlink] = useState(false);
  const talkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (speaking) {
      talkIntervalRef.current = setInterval(() => setMouthFrame((f) => (f + 1) % TALK_MOUTHS.length), 160);
    }
    return () => {
      if (talkIntervalRef.current) clearInterval(talkIntervalRef.current);
    };
  }, [speaking]);

  useEffect(() => {
    function scheduleBlink() {
      const delay = 2200 + Math.random() * 2600;
      blinkTimeoutRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={(size * 240) / 200}
      className={`presenter-svg ${className ?? ''}`}
      role="img"
      aria-label="Presentadora"
    >
      {/* coletas traseras */}
      <path d="M40,95 Q10,140 22,205 Q34,220 46,205 Q34,150 55,105 Z" fill={HAIR_DARK} />
      <path d="M160,95 Q190,140 178,205 Q166,220 154,205 Q166,150 145,105 Z" fill={HAIR_DARK} />

      {/* hombros / chaqueta */}
      <path d="M28,240 Q34,175 100,168 Q166,175 172,240 Z" fill={BLAZER} />
      <path d="M85,178 L100,196 L115,178 L108,172 L100,180 L92,172 Z" fill={ACCENT} />
      <path d="M40,238 Q46,190 90,178 L100,240 Z" fill={BLAZER_LIGHT} opacity={0.5} />

      {/* cara */}
      <ellipse cx={100} cy={98} rx={56} ry={60} fill={SKIN} />

      {/* pelo trasero (detrás de la cara, parte superior) */}
      <path
        d="M44,98 Q38,36 100,26 Q162,36 156,98 Q150,70 100,66 Q50,70 44,98 Z"
        fill={HAIR_DARK}
      />
      {/* flequillo */}
      <path
        d="M46,86 Q42,44 100,34 Q158,44 154,86 Q150,58 128,52 Q136,66 130,80 Q118,54 100,52 Q104,68 96,80 Q86,52 74,54 Q80,66 72,78 Q60,56 46,86 Z"
        fill={HAIR_LIGHT}
      />
      <path d="M44,90 Q40,50 100,38 Q160,50 156,90 Q152,58 100,50 Q48,58 44,90 Z" fill={HAIR_DARK} opacity={0.55} />

      {/* mofletes */}
      <ellipse cx={68} cy={116} rx={11} ry={6.5} fill={BLUSH} opacity={0.55} />
      <ellipse cx={132} cy={116} rx={11} ry={6.5} fill={BLUSH} opacity={0.55} />

      {blink && expression !== 'happy' ? (
        <g>
          <path d="M65,96 Q78,100 91,96" fill="none" stroke="#3a2a5c" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M109,96 Q122,100 135,96" fill="none" stroke="#3a2a5c" strokeWidth={3.4} strokeLinecap="round" />
        </g>
      ) : (
        <EyesAndBrows expression={expression} />
      )}

      {speaking ? (
        <path d={TALK_MOUTHS[mouthFrame]} fill="#8a3b52" stroke="#3a2a5c" strokeWidth={1.5} />
      ) : (
        <IdleMouth expression={expression} />
      )}

      {/* diadema de auriculares de presentadora */}
      <path d="M40,66 Q100,10 160,66" fill="none" stroke="#3a2a5c" strokeWidth={5} strokeLinecap="round" />
      <circle cx={40} cy={70} r={9} fill="#3a2a5c" />
      <circle cx={160} cy={70} r={9} fill="#3a2a5c" />
      <circle cx={40} cy={70} r={3.4} fill={ACCENT} />
      <path d="M160,78 Q150,110 118,124" fill="none" stroke="#3a2a5c" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={116} cy={126} r={5} fill="#3a2a5c" />
      <circle cx={116} cy={126} r={2} fill={ACCENT} />
    </svg>
  );
}
