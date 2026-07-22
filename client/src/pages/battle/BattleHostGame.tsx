import React from 'react';
import { BATTLE_WEAPONS, type BattleRoomPublic } from '@rosco/shared';
import Timer from '../../components/Timer';
import BattlePlayerCard from '../../components/BattlePlayerCard';
import BattleAttackFx from '../../components/BattleAttackFx';
import { QUIZ_OPTION_STYLES } from '../../constants';

interface BattleHostGameProps {
  room: BattleRoomPublic;
}

export default function BattleHostGame({ room }: BattleHostGameProps) {
  const question = room.currentQuestion;
  const isAttacking = room.status === 'attacking';
  const isReveal = room.status === 'reveal';
  const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
  const endsAt = isAttacking ? room.attackEndsAt : isReveal ? room.revealEndsAt : room.questionEndsAt;

  const attackWeapon = room.lastAttack ? BATTLE_WEAPONS.find((w) => w.id === room.lastAttack!.weaponId) : null;
  const attacker = room.lastAttack ? room.players.find((p) => p.id === room.lastAttack!.attackerId) : null;
  const target = room.lastAttack ? room.players.find((p) => p.id === room.lastAttack!.targetId) : null;

  return (
    <div className="screen screen-center battle-host-screen">
      <div className="battle-players-row">
        {room.players.map((p) => (
          <BattlePlayerCard key={p.id} player={p} isActive={p.id === room.activePlayerId} compact />
        ))}
      </div>

      <div className="quiz-host-topbar">
        <span className="quiz-progress-badge">Turno de {activePlayer?.name ?? '...'}</span>
        <Timer endsAt={endsAt} large />
      </div>

      {question && (
        <div className="quiz-question-card">
          <h1 className="quiz-question-text">{question.question}</h1>
        </div>
      )}

      {question && !isAttacking && (
        <div className="quiz-options-grid quiz-options-grid-host">
          {question.options.map((option, i) => {
            const style = QUIZ_OPTION_STYLES[i];
            const isCorrect = isReveal && room.revealCorrectIndex === i;
            const isDimmed = isReveal && room.revealCorrectIndex !== i;
            return (
              <div
                key={i}
                className={`quiz-option-tile ${isCorrect ? 'quiz-option-correct' : ''} ${isDimmed ? 'quiz-option-dimmed' : ''}`}
                style={{ backgroundColor: style.color }}
              >
                <span className="quiz-option-shape">{style.shape}</span>
                <span className="quiz-option-label">{option}</span>
                {isCorrect && <span className="quiz-option-check">✓</span>}
              </div>
            );
          })}
        </div>
      )}

      {isAttacking && (
        <p className="battle-status-message">⚔️ {activePlayer?.name} ha acertado y está eligiendo un arma...</p>
      )}

      {isReveal && (
        <p className="battle-status-message">
          {room.lastAnswerCorrect && attacker && target && attackWeapon
            ? `${attackWeapon.icon} ¡${attacker.name} atacó a ${target.name} con ${attackWeapon.name.toLowerCase()}! -${room.lastAttack!.damage} HP`
            : `❌ ${activePlayer?.name} ha fallado, no hace daño esta vez.`}
        </p>
      )}

      <BattleAttackFx
        revealKey={isReveal ? String(room.revealEndsAt) : null}
        correct={room.lastAnswerCorrect}
        attackerName={attacker?.name}
        attackerMii={attacker?.mii}
        targetName={target?.name}
        targetMii={target?.mii}
        weapon={attackWeapon ?? null}
        damage={room.lastAttack?.damage ?? 0}
        targetDefeated={room.lastAttack?.targetDefeated ?? false}
      />
    </div>
  );
}
