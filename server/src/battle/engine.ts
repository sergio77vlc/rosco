import { BATTLE_START_HP, BATTLE_WEAPONS } from '@rosco/shared';
import type {
  BattleAttackResult,
  BattlePlayerPublic,
  BattleRankingEntry,
  BattleRoomPublic,
  MiiConfig,
} from '@rosco/shared';
import type { ServerBattlePlayer, ServerBattleRoom } from './roomTypes.js';

export function createBattlePlayer(id: string, socketId: string, name: string, mii: MiiConfig): ServerBattlePlayer {
  return {
    id,
    socketId,
    name,
    mii,
    connected: true,
    hp: BATTLE_START_HP,
    alive: true,
    joinedAt: Date.now(),
  };
}

/** Siguiente jugador vivo en el orden de turno, a partir de (sin incluir) `afterId`. */
export function nextAlivePlayerId(room: ServerBattleRoom, afterId: string | null): string | null {
  const order = room.turnOrder;
  if (order.length === 0) return null;
  const startIdx = afterId ? order.indexOf(afterId) : -1;
  for (let i = 1; i <= order.length; i++) {
    const idx = (startIdx + i + order.length) % order.length;
    const candidate = room.players.get(order[idx]);
    if (candidate?.alive) return candidate.id;
  }
  return null;
}

export function aliveCount(room: ServerBattleRoom): number {
  return Array.from(room.players.values()).filter((p) => p.alive).length;
}

export function aliveOpponents(room: ServerBattleRoom, selfId: string): ServerBattlePlayer[] {
  return Array.from(room.players.values()).filter((p) => p.alive && p.id !== selfId);
}

export function applyAttack(room: ServerBattleRoom, attackerId: string, targetId: string, weaponId: string): BattleAttackResult {
  const weapon = BATTLE_WEAPONS.find((w) => w.id === weaponId) ?? BATTLE_WEAPONS[0];
  const target = room.players.get(targetId)!;
  target.hp = Math.max(0, target.hp - weapon.damage);
  const targetDefeated = target.hp <= 0;
  if (targetDefeated) {
    target.alive = false;
    room.eliminationOrder.push(target.id);
  }
  return { attackerId, targetId, weaponId: weapon.id, damage: weapon.damage, targetDefeated };
}

export function computeBattleRanking(room: ServerBattleRoom): BattleRankingEntry[] {
  const winner = Array.from(room.players.values()).find((p) => p.alive);
  const ordered: ServerBattlePlayer[] = [];
  if (winner) ordered.push(winner);
  for (let i = room.eliminationOrder.length - 1; i >= 0; i--) {
    const p = room.players.get(room.eliminationOrder[i]);
    if (p) ordered.push(p);
  }
  return ordered.map((p, i) => ({ playerId: p.id, name: p.name, mii: p.mii, place: i + 1 }));
}

function toPublicPlayer(player: ServerBattlePlayer): BattlePlayerPublic {
  return {
    id: player.id,
    name: player.name,
    mii: player.mii,
    connected: player.connected,
    hp: player.hp,
    alive: player.alive,
  };
}

export function toPublicBattleRoom(room: ServerBattleRoom): BattleRoomPublic {
  const showQuestion = room.status === 'question' || room.status === 'attacking' || room.status === 'reveal';
  const showCorrectIndex = room.status === 'reveal' || room.status === 'finished';
  return {
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
    activePlayerId: room.activePlayerId,
    currentQuestion:
      showQuestion && room.currentQuestion
        ? {
            id: room.currentQuestion.id,
            question: room.currentQuestion.question,
            options: room.currentQuestion.options,
            difficulty: room.currentQuestion.difficulty,
          }
        : null,
    questionEndsAt: room.questionEndsAt,
    awaitingAttackChoice: room.status === 'attacking',
    attackTargetOptions: room.attackTargetOptions,
    attackEndsAt: room.attackEndsAt,
    lastAttack: room.lastAttack,
    lastAnswerCorrect: room.lastAnswerCorrect,
    revealCorrectIndex: showCorrectIndex && room.currentQuestion ? room.currentQuestion.correctIndex : null,
    revealEndsAt: room.revealEndsAt,
    hostConnected: room.hostConnected,
    players: Array.from(room.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(toPublicPlayer),
  };
}
