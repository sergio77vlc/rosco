import type { QuizDifficulty, QuizQuestionView } from './types.js';

// ==========================================================================
// Mii: personaje personalizable de cada jugador (pelo, ropa, tono de piel,
// y opcionalmente su propia foto colocada en la cara).
// ==========================================================================

export type MiiHairStyle = 'corto' | 'largo' | 'moicano' | 'rizado' | 'gorra';
export type MiiOutfitStyle = 'camiseta' | 'sudadera' | 'vestido' | 'traje';

export interface MiiConfig {
  skinTone: string;
  hairStyle: MiiHairStyle;
  hairColor: string;
  outfitStyle: MiiOutfitStyle;
  outfitColor: string;
  /** Foto de la cara del jugador (data URL), o null para usar la cara de dibujo por defecto. */
  photo: string | null;
}

export const MII_SKIN_TONES = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3825'] as const;

export const MII_HAIR_COLORS = [
  '#2b2b2b', '#5a3825', '#8d5524', '#d4a017', '#e63946', '#9d4edd', '#f5f5f5', '#3b82f6',
] as const;

export const MII_OUTFIT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
] as const;

export const MII_HAIR_STYLES: { id: MiiHairStyle; label: string; icon: string }[] = [
  { id: 'corto', label: 'Corto', icon: '💇' },
  { id: 'largo', label: 'Largo', icon: '👱' },
  { id: 'moicano', label: 'Moicano', icon: '🤘' },
  { id: 'rizado', label: 'Rizado', icon: '🦱' },
  { id: 'gorra', label: 'Gorra', icon: '🧢' },
];

export const MII_OUTFIT_STYLES: { id: MiiOutfitStyle; label: string; icon: string }[] = [
  { id: 'camiseta', label: 'Camiseta', icon: '👕' },
  { id: 'sudadera', label: 'Sudadera', icon: '🧥' },
  { id: 'vestido', label: 'Vestido', icon: '👗' },
  { id: 'traje', label: 'Traje', icon: '🤵' },
];

export const DEFAULT_MII_CONFIG: MiiConfig = {
  skinTone: MII_SKIN_TONES[0],
  hairStyle: 'corto',
  hairColor: MII_HAIR_COLORS[0],
  outfitStyle: 'camiseta',
  outfitColor: MII_OUTFIT_COLORS[5],
  photo: null,
};

// ==========================================================================
// Batalla: duelo por turnos a base de preguntas de cultura general. Acertar
// permite elegir un arma y a quién atacar; fallar o agotar el tiempo pasa el
// turno sin hacer daño. Gana el último jugador que quede con vida.
// ==========================================================================

export interface BattleWeapon {
  id: string;
  name: string;
  icon: string;
  damage: number;
}

export const BATTLE_WEAPONS: BattleWeapon[] = [
  { id: 'tomate', name: 'Tomate', icon: '🍅', damage: 15 },
  { id: 'platano', name: 'Piel de plátano', icon: '🍌', damage: 15 },
  { id: 'tarta', name: 'Tarta de nata', icon: '🥧', damage: 20 },
  { id: 'bomba', name: 'Bomba', icon: '💣', damage: 25 },
  { id: 'yunque', name: 'Yunque', icon: '⚒️', damage: 30 },
];

export const BATTLE_START_HP = 100;

export type BattleRoomStatus = 'lobby' | 'question' | 'attacking' | 'reveal' | 'finished';

export interface BattlePlayerPublic {
  id: string;
  name: string;
  mii: MiiConfig;
  connected: boolean;
  hp: number;
  alive: boolean;
}

export interface BattleAttackResult {
  attackerId: string;
  targetId: string;
  weaponId: string;
  damage: number;
  targetDefeated: boolean;
}

export interface BattleRoomPublic {
  code: string;
  status: BattleRoomStatus;
  maxPlayers: number;
  difficulty: QuizDifficulty;
  activePlayerId: string | null;
  currentQuestion: QuizQuestionView | null;
  questionEndsAt: number | null;
  awaitingAttackChoice: boolean;
  attackTargetOptions: string[] | null;
  attackEndsAt: number | null;
  lastAttack: BattleAttackResult | null;
  lastAnswerCorrect: boolean | null;
  revealCorrectIndex: number | null;
  revealEndsAt: number | null;
  hostConnected: boolean;
  players: BattlePlayerPublic[];
}

export interface BattleRankingEntry {
  playerId: string;
  name: string;
  mii: MiiConfig;
  place: number;
}

// ---- Socket.IO event payloads ----

export interface BattleHostCreateRoomPayload {
  maxPlayers: number;
  difficulty: QuizDifficulty;
  /** Si se indica, las preguntas salen de este paquete guardado en el servidor en vez de la pila viva. */
  packId?: string;
}

export interface BattlePlayerJoinRoomPayload {
  code: string;
  name: string;
  mii: MiiConfig;
}

export interface BattlePlayerAnswerPayload {
  code: string;
  optionIndex: 0 | 1 | 2 | 3;
}

export interface BattlePlayerAttackPayload {
  code: string;
  targetId: string;
  weaponId: string;
}

export interface BattleGameFinishedPayload {
  ranking: BattleRankingEntry[];
}
