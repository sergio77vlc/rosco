import type { Difficulty } from '@rosco/shared';

export const TIMER_OPTIONS = [
  { label: '1:30 min', seconds: 90 },
  { label: '2:00 min', seconds: 120 },
  { label: '3:00 min', seconds: 180 },
  { label: '4:00 min', seconds: 240 },
  { label: '10:00 min', seconds: 600 },
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  facil: '🟢',
  medio: '🟡',
  dificil: '🔴',
};

export interface CategoryInfo {
  label: string;
  icon: string;
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  'cultura general': { label: 'Cultura general', icon: '🧠' },
  animales: { label: 'Animales', icon: '🐾' },
  cine: { label: 'Cine y series', icon: '🎬' },
  geografia: { label: 'Geografía', icon: '🌍' },
  ciencia: { label: 'Ciencia', icon: '🔬' },
  historia: { label: 'Historia', icon: '🏛️' },
  deportes: { label: 'Deportes', icon: '⚽' },
};

export const CATEGORY_ORDER = ['cultura general', 'animales', 'cine', 'geografia', 'ciencia', 'historia', 'deportes'];

export function categoryInfo(theme: string): CategoryInfo {
  return CATEGORY_INFO[theme] ?? { label: theme, icon: '📋' };
}
