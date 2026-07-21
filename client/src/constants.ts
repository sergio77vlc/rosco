import type { Difficulty } from '@rosco/shared';

export const TIMER_OPTIONS = [
  { label: '1:30 min', seconds: 90 },
  { label: '2:00 min', seconds: 120 },
  { label: '3:00 min', seconds: 180 },
  { label: '4:00 min', seconds: 240 },
  { label: '10:00 min', seconds: 600 },
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  medio: 'Normal',
  dificil: 'Difícil',
};

export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  medio: '🟡',
  dificil: '🔴',
};

export interface CategoryInfo {
  label: string;
  icon: string;
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  'cultura general': { label: 'Cultura general', icon: '🧠' },
};

export const CATEGORY_ORDER = ['cultura general'];

export function categoryInfo(theme: string): CategoryInfo {
  return CATEGORY_INFO[theme] ?? { label: theme, icon: '📋' };
}
