import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BATTLE_WEAPONS } from '@rosco/shared';
import { useLocalBattle } from '../../context/BattleLocalContext';
import MiiAvatar from '../../components/MiiAvatar';
import BattlePlayerCard from '../../components/BattlePlayerCard';
import BattlePodium from '../../components/BattlePodium';
import BattleAttackFx from '../../components/BattleAttackFx';
import { computeLocalBattleRanking } from '../../utils/battleRank';
import { QUIZ_OPTION_STYLES } from '../../constants';

export default function BattleLocalGamePage() {
  const navigate = useNavigate();
  const {
    players,
    activePlayerId,
    currentQuestion,
    phase,
    attackTargetOptions,
    lastAttack,
    lastAnswerCorrect,
    revealId,
    eliminationOrder,
    answer,
    attack,
    resetGame,
  } = useLocalBattle();

  const [turnReady, setTurnReady] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => setTurnReady(false), [activePlayerId]);
  useEffect(() => {
    setSelectedOptionIndex(null);
    setSelectedTargetId(null);
  }, [currentQuestion?.id, phase]);
  useEffect(() => {
    if (phase === 'attacking' && attackTargetOptions?.length === 1 && !selectedTargetId) {
      setSelectedTargetId(attackTargetOptions[0]);
    }
  }, [phase, attackTargetOptions, selectedTargetId]);

  if (players.length === 0) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">
          No hay ninguna batalla en marcha.{' '}
          <a className="link" href="/battle/local">
            Configura una partida
          </a>
          .
        </p>
      </div>
    );
  }

  if (phase === 'results') {
    const ranking = computeLocalBattleRanking(players, eliminationOrder);
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">🏁 ¡Fin de la batalla!</h1>
        {ranking[0] && <p className="app-subtitle">🏆 {ranking[0].name} ha ganado la batalla</p>}
        <BattlePodium ranking={ranking} />
        <button
          className="btn btn-primary btn-big"
          onClick={() => {
            resetGame();
            navigate('/battle/local');
          }}
        >
          🔁 Nueva batalla
        </button>
      </div>
    );
  }

  const activePlayer = players.find((p) => p.id === activePlayerId);
  if (!activePlayer || !currentQuestion) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (!turnReady) {
    return (
      <div className="screen screen-center turn-gate">
        <MiiAvatar mii={activePlayer.mii} size={140} />
        <h2 className="turn-gate-title">¡Tu turno, {activePlayer.name}!</h2>
        <p className="turn-gate-hint">Pásale el móvil y toca cuando estés listo.</p>
        <button type="button" className="btn btn-primary btn-big turn-gate-button" onClick={() => setTurnReady(true)}>
          ▶️ ¡Empezar!
        </button>
      </div>
    );
  }

  const isAttacking = phase === 'attacking';
  const isReveal = phase === 'reveal';
  const attackTargets = attackTargetOptions ? players.filter((p) => attackTargetOptions.includes(p.id)) : [];
  const attackWeapon = lastAttack ? BATTLE_WEAPONS.find((w) => w.id === lastAttack.weaponId) : null;
  const attacker = lastAttack ? players.find((p) => p.id === lastAttack.attackerId) : null;
  const target = lastAttack ? players.find((p) => p.id === lastAttack.targetId) : null;

  function handleAnswer(optionIndex: number) {
    if (phase !== 'question' || !currentQuestion) return;
    setSelectedOptionIndex(optionIndex);
    answer(optionIndex === currentQuestion.correctIndex);
  }

  return (
    <div className="screen screen-center battle-player-screen">
      <div className="battle-players-row battle-players-row-compact">
        {players.map((p) => (
          <BattlePlayerCard key={p.id} player={p} isActive={p.id === activePlayerId} compact size={40} />
        ))}
      </div>

      <div className="quiz-player-topbar">
        <span className="quiz-progress-badge">Turno de {activePlayer.name}</span>
      </div>

      <h1 className="quiz-question-text quiz-question-text-player">{currentQuestion.question}</h1>

      {!isAttacking && (
        <div className="quiz-options-grid">
          {currentQuestion.options.map((option, i) => {
            const style = QUIZ_OPTION_STYLES[i];
            const isMine = selectedOptionIndex === i;
            const isCorrect = isReveal && currentQuestion.correctIndex === i;
            const isWrongPick = isReveal && isMine && currentQuestion.correctIndex !== i;
            const isDimmed = isReveal && !isCorrect && !isWrongPick;
            return (
              <button
                key={i}
                type="button"
                className={`quiz-option-tile quiz-option-tile-button ${isMine && !isReveal ? 'quiz-option-selected' : ''} ${isCorrect ? 'quiz-option-correct' : ''} ${isWrongPick ? 'quiz-option-wrong' : ''} ${isDimmed ? 'quiz-option-dimmed' : ''}`}
                style={{ backgroundColor: style.color }}
                onClick={() => handleAnswer(i)}
                disabled={phase !== 'question'}
              >
                <span className="quiz-option-shape">{style.shape}</span>
                <span className="quiz-option-label">{option}</span>
                {isCorrect && <span className="quiz-option-check">✓</span>}
                {isWrongPick && <span className="quiz-option-check">✗</span>}
              </button>
            );
          })}
        </div>
      )}

      {isAttacking && !selectedTargetId && (
        <div className="battle-target-picker">
          <p className="battle-status-message">¡Acertaste! Elige a quién atacar</p>
          <div className="battle-players-row">
            {attackTargets.map((t) => (
              <BattlePlayerCard key={t.id} player={t} onClick={() => setSelectedTargetId(t.id)} />
            ))}
          </div>
        </div>
      )}

      {isAttacking && selectedTargetId && (
        <div className="battle-weapon-picker">
          <p className="battle-status-message">Elige tu arma</p>
          <div className="battle-weapon-grid">
            {BATTLE_WEAPONS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="battle-weapon-tile"
                onClick={() => attack(selectedTargetId, w.id)}
              >
                <span className="battle-weapon-icon">{w.icon}</span>
                <span className="battle-weapon-name">{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isReveal && (
        <p
          className={`quiz-reveal-feedback ${lastAnswerCorrect ? 'quiz-reveal-feedback-correct' : 'quiz-reveal-feedback-wrong'}`}
        >
          {lastAnswerCorrect && attacker && target && attackWeapon
            ? `${attackWeapon.icon} ¡${attacker.name} atacó a ${target.name} con ${attackWeapon.name.toLowerCase()}! -${lastAttack!.damage} HP`
            : `❌ ${activePlayer.name} ha fallado, no hace daño esta vez.`}
        </p>
      )}

      <BattleAttackFx
        revealKey={isReveal ? String(revealId) : null}
        correct={lastAnswerCorrect}
        attackerName={attacker?.name}
        attackerMii={attacker?.mii}
        targetName={target?.name}
        targetMii={target?.mii}
        weapon={attackWeapon ?? null}
        damage={lastAttack?.damage ?? 0}
        targetDefeated={lastAttack?.targetDefeated ?? false}
      />
    </div>
  );
}
