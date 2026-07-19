import type { Difficulty } from '@rosco/shared';

export const TIMER_OPTIONS = [
  { label: '1:30 min', seconds: 90 },
  { label: '2:00 min', seconds: 120 },
  { label: '3:00 min', seconds: 180 },
  { label: '4:00 min', seconds: 240 },
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};
