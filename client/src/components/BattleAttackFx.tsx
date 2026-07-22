import React, { useEffect, useState } from 'react';
import type { BattleWeapon, MiiConfig } from '@rosco/shared';
import MiiAvatar from './MiiAvatar';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { pickAttackLine, pickMissLine } from '../utils/battleNarration';

interface BattleAttackFxProps {
  /** Cambia en cada nueva resolución (acierto o fallo); dispara la secuencia. `null` = nada que mostrar. */
  revealKey: string | number | null;
  /** true = acertó y atacó, false = falló, null = todavía no hay resultado. */
  correct: boolean | null;
  attackerName?: string;
  attackerMii?: MiiConfig;
  targetName?: string;
  targetMii?: MiiConfig;
  weapon: BattleWeapon | null;
  damage: number;
  targetDefeated: boolean;
}

type Stage = 'idle' | 'windup' | 'travel' | 'impact';

const TRAVEL_MS: Record<BattleWeapon['anim'], number> = {
  throw: 600,
  shoot: 320,
  punch: 260,
  drop: 550,
  explode: 500,
};

const TRAJECTORY_CLASS: Record<BattleWeapon['anim'], string> = {
  throw: 'fx-projectile-arc',
  shoot: 'fx-projectile-straight',
  punch: 'fx-projectile-straight',
  drop: 'fx-projectile-drop',
  explode: 'fx-projectile-arc',
};

export default function BattleAttackFx({
  revealKey,
  correct,
  attackerName,
  attackerMii,
  targetName,
  targetMii,
  weapon,
  damage,
  targetDefeated,
}: BattleAttackFxProps) {
  const tts = useSpeechSynthesis();
  const [stage, setStage] = useState<Stage>('idle');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (revealKey == null) return;

    if (correct && weapon && attackerName && targetName) {
      const line = pickAttackLine(weapon.id, attackerName, targetName, targetDefeated);
      setCaption(line);
      setStage('windup');
      if (tts.supported && tts.narrate) tts.speak(line, { interrupt: true });

      const travelMs = TRAVEL_MS[weapon.anim];
      const t1 = setTimeout(() => setStage('travel'), 180);
      const t2 = setTimeout(() => setStage('impact'), 180 + travelMs);
      const t3 = setTimeout(() => setStage('idle'), 180 + travelMs + 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    if (correct === false && attackerName) {
      const line = pickMissLine(attackerName);
      if (tts.supported && tts.narrate) tts.speak(line, { interrupt: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  if (stage === 'idle' || !weapon) return null;

  const anim = weapon.anim;

  return (
    <div className={`battle-fx-backdrop ${stage === 'impact' ? 'battle-fx-flash' : ''}`}>
      <div className="battle-fx-stage">
        <div className={`battle-fx-char battle-fx-attacker ${stage === 'windup' || stage === 'travel' ? `fx-windup-${anim}` : ''}`}>
          {attackerMii && <MiiAvatar mii={attackerMii} size={120} />}
          <span className="battle-fx-name">{attackerName}</span>
        </div>

        {stage === 'travel' && (
          <span
            className={`battle-fx-projectile ${TRAJECTORY_CLASS[anim]}`}
            style={{ animationDuration: `${TRAVEL_MS[anim]}ms` }}
          >
            {weapon.icon}
          </span>
        )}

        <div className={`battle-fx-char battle-fx-target ${stage === 'impact' ? 'fx-hit' : ''}`}>
          {targetMii && (
            <MiiAvatar
              mii={targetMii}
              expression={stage === 'impact' ? (targetDefeated ? 'ko' : 'dolor') : 'neutral'}
              size={120}
            />
          )}
          <span className="battle-fx-name">{targetName}</span>
          {stage === 'impact' && (
            <>
              <span className={`battle-fx-burst ${anim === 'explode' ? 'battle-fx-burst-big' : ''}`}>💥</span>
              <span className="battle-fx-damage">-{damage}</span>
            </>
          )}
        </div>
      </div>
      <p className="battle-fx-caption">{caption}</p>
    </div>
  );
}
