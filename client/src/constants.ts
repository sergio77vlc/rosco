import type { Difficulty, QuizDifficulty } from '@rosco/shared';

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

export const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  medio: 'Normal',
  dificil: 'Difícil',
  mixto: 'Mixta',
};

export const QUIZ_DIFFICULTY_ICONS: Record<QuizDifficulty, string> = {
  medio: '🟡',
  dificil: '🔴',
  mixto: '🎲',
};

export const QUIZ_DURATION_OPTIONS = [
  { label: '10s', seconds: 10 },
  { label: '20s', seconds: 20 },
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '60s', seconds: 60 },
];

export interface QuizOptionStyle {
  color: string;
  shape: string;
}

export const QUIZ_OPTION_STYLES: QuizOptionStyle[] = [
  { color: '#e53935', shape: '▲' },
  { color: '#1e88e5', shape: '◆' },
  { color: '#fbc02d', shape: '●' },
  { color: '#43a047', shape: '■' },
];
