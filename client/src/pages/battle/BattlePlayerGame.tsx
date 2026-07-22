import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BATTLE_WEAPONS } from '@rosco/shared';
import { useBattle } from '../../context/BattleContext';
import { useRoomReconnect } from '../../hooks/useRoomReconnect';
import { loadSession } from '../../utils/session';
import Timer from '../../components/Timer';
import BattlePlayerCard from '../../components/BattlePlayerCard';
import BattlePodium from '../../components/BattlePodium';
import BattleAttackFx from '../../components/BattleAttackFx';
import { fallbackBattleRanking } from '../../utils/battleRank';
import { QUIZ_OPTION_STYLES } from '../../constants';

export default function BattlePlayerGame() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, playerId, ranking, emitWithAck, setPlayerId } = useBattle();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const player = room?.players.find((p) => p.id === playerId);

  useRoomReconnect({
    code,
    prefix: 'battle',
    hostReconnectEvent: 'battle:hostReconnect',
    playerReconnectEvent: 'battle:playerReconnect',
    emitWithAck,
    setPlayerId,
    onPlayerReconnectFailed: () => navigate(`/battle/join/${code}`),
  });

  useEffect(() => {
    if (playerId || !code) return;
    const session = loadSession('battle', code);
    if (!session?.playerId) navigate(`/battle/join/${code}`);
  }, [playerId, code, navigate]);

  useEffect(() => {
    setSelectedOptionIndex(null);
    setSelectedTargetId(null);
  }, [room?.currentQuestion?.id, room?.status]);

  useEffect(() => {
    if (room?.status === 'attacking' && room.attackTargetOptions?.length === 1 && !selectedTargetId) {
      setSelectedTargetId(room.attackTargetOptions[0]);
    }
  }, [room?.status, room?.attackTargetOptions, selectedTargetId]);

  if (!room || !player || !code) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Cargando partida...</p>
      </div>
    );
  }

  if (room.status === 'finished') {
    const finalRanking = ranking ?? fallbackBattleRanking(room.players);
    const myEntry = finalRanking.find((r) => r.playerId === playerId);
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">🏁 ¡Fin de la batalla!</h1>
        {myEntry && (
          <p className="app-subtitle">
            {myEntry.place === 1 ? '🏆 ¡Has ganado la batalla!' : `Quedaste en el puesto #${myEntry.place}.`}
          </p>
        )}
        <BattlePodium ranking={finalRanking} highlightPlayerId={playerId} />
      </div>
    );
  }

  if (room.status === 'lobby' || !room.currentQuestion) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">Esperando la siguiente ronda...</p>
      </div>
    );
  }

  const isMyTurn = room.activePlayerId === playerId;
  const isAttacking = room.status === 'attacking';
  const isReveal = room.status === 'reveal';
  const question = room.currentQuestion;
  const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
  const endsAt = isAttacking ? room.attackEndsAt : isReveal ? room.revealEndsAt : room.questionEndsAt;

  const attackTargets = room.attackTargetOptions
    ? room.players.filter((p) => room.attackTargetOptions!.includes(p.id))
    : [];

  async function handleAnswer(optionIndex: 0 | 1 | 2 | 3) {
    if (!isMyTurn || sending || room?.status !== 'question') return;
    setSelectedOptionIndex(optionIndex);
    setSending(true);
    try {
      await emitWithAck('battle:playerAnswer', { code, optionIndex });
    } finally {
      setSending(false);
    }
  }

  async function pickWeapon(weaponId: string) {
    if (!selectedTargetId || sending) return;
    setSending(true);
    try {
      await emitWithAck('battle:playerAttack', { code, targetId: selectedTargetId, weaponId });
    } finally {
      setSending(false);
    }
  }

  const attackWeapon = room.lastAttack ? BATTLE_WEAPONS.find((w) => w.id === room.lastAttack!.weaponId) : null;
  const attacker = room.lastAttack ? room.players.find((p) => p.id === room.lastAttack!.attackerId) : null;
  const target = room.lastAttack ? room.players.find((p) => p.id === room.lastAttack!.targetId) : null;

  return (
    <div className="screen screen-center battle-player-screen">
      <div className="battle-players-row battle-players-row-compact">
        {room.players.map((p) => (
          <BattlePlayerCard key={p.id} player={p} isActive={p.id === room.activePlayerId} compact size={40} />
        ))}
      </div>

      <div className="quiz-player-topbar">
        <span className="quiz-progress-badge">{isMyTurn ? '¡Tu turno!' : `Turno de ${activePlayer?.name ?? '...'}`}</span>
        <Timer endsAt={endsAt} compact />
      </div>

      <h1 className="quiz-question-text quiz-question-text-player">{question.question}</h1>

      {!isAttacking && (
        <div className="quiz-options-grid">
          {question.options.map((option, i) => {
            const style = QUIZ_OPTION_STYLES[i];
            const isMine = selectedOptionIndex === i;
            const isCorrect = isReveal && room.revealCorrectIndex === i;
            const isWrongPick = isReveal && isMine && room.revealCorrectIndex !== i;
            const isDimmed = isReveal && !isCorrect && !isWrongPick;
            return (
              <button
                key={i}
                type="button"
                className={`quiz-option-tile quiz-option-tile-button ${isMine && !isReveal ? 'quiz-option-selected' : ''} ${isCorrect ? 'quiz-option-correct' : ''} ${isWrongPick ? 'quiz-option-wrong' : ''} ${isDimmed ? 'quiz-option-dimmed' : ''}`}
                style={{ backgroundColor: style.color }}
                onClick={() => handleAnswer(i as 0 | 1 | 2 | 3)}
                disabled={!isMyTurn || room.status !== 'question'}
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

      {isAttacking && !isMyTurn && (
        <p className="battle-status-message">⚔️ {activePlayer?.name} está eligiendo un arma para atacar...</p>
      )}

      {isAttacking && isMyTurn && !selectedTargetId && (
        <div className="battle-target-picker">
          <p className="battle-status-message">¡Acertaste! Elige a quién atacar</p>
          <div className="battle-players-row">
            {attackTargets.map((t) => (
              <BattlePlayerCard key={t.id} player={t} onClick={() => setSelectedTargetId(t.id)} />
            ))}
          </div>
        </div>
      )}

      {isAttacking && isMyTurn && selectedTargetId && (
        <div className="battle-weapon-picker">
          <p className="battle-status-message">Elige tu arma</p>
          <div className="battle-weapon-grid">
            {BATTLE_WEAPONS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="battle-weapon-tile"
                onClick={() => pickWeapon(w.id)}
                disabled={sending}
              >
                <span className="battle-weapon-icon">{w.icon}</span>
                <span className="battle-weapon-name">{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isReveal && (
        <p className={`quiz-reveal-feedback ${room.lastAnswerCorrect ? 'quiz-reveal-feedback-correct' : 'quiz-reveal-feedback-wrong'}`}>
          {room.lastAnswerCorrect && attacker && target && attackWeapon
            ? target.id === playerId
              ? `${attackWeapon.icon} ¡${attacker.name} te ha atacado con ${attackWeapon.name.toLowerCase()}! -${room.lastAttack!.damage} HP`
              : `${attackWeapon.icon} ${attacker.name} atacó a ${target.name} con ${attackWeapon.name.toLowerCase()}: -${room.lastAttack!.damage} HP`
            : isMyTurn
              ? '❌ Has fallado, no haces daño esta vez.'
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
