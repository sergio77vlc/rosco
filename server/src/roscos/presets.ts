import type { Rosco } from '@rosco/shared';
import { CULTURA_GENERAL_ROSCOS } from './data/culturaGeneral.js';
import { ANIMALES_ROSCOS } from './data/animales.js';
import { CINE_ROSCOS } from './data/cine.js';
import { GEOGRAFIA_ROSCOS } from './data/geografia.js';
import { CIENCIA_ROSCOS } from './data/ciencia.js';
import { HISTORIA_ROSCOS } from './data/historia.js';
import { DEPORTES_ROSCOS } from './data/deportes.js';

export const PRESET_ROSCOS: Rosco[] = [
  ...CULTURA_GENERAL_ROSCOS,
  ...ANIMALES_ROSCOS,
  ...CINE_ROSCOS,
  ...GEOGRAFIA_ROSCOS,
  ...CIENCIA_ROSCOS,
  ...HISTORIA_ROSCOS,
  ...DEPORTES_ROSCOS,
];

export function getPresetById(id: string): Rosco | undefined {
  return PRESET_ROSCOS.find((r) => r.id === id);
}
