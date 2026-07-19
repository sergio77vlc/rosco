import type { Rosco } from '@rosco/shared';
import { CULTURA_GENERAL_ROSCOS } from './data/culturaGeneral.js';
import { CULTURA_GENERAL_FACIL_EXTRA_ROSCOS } from './data/culturaGeneralFacilExtra.js';
import { CULTURA_GENERAL_MEDIO_ROSCOS } from './data/culturaGeneralMedio.js';
import { CULTURA_GENERAL_DIFICIL_EXTRA_ROSCOS } from './data/culturaGeneralDificilExtra.js';
import { ANIMALES_ROSCOS } from './data/animales.js';
import { ANIMALES_EXTRA_ROSCOS } from './data/animalesExtra.js';
import { CINE_ROSCOS } from './data/cine.js';
import { CINE_EXTRA_ROSCOS } from './data/cineExtra.js';
import { GEOGRAFIA_ROSCOS } from './data/geografia.js';
import { GEOGRAFIA_EXTRA_ROSCOS } from './data/geografiaExtra.js';
import { CIENCIA_ROSCOS } from './data/ciencia.js';
import { CIENCIA_EXTRA_ROSCOS } from './data/cienciaExtra.js';
import { HISTORIA_ROSCOS } from './data/historia.js';
import { HISTORIA_EXTRA_ROSCOS } from './data/historiaExtra.js';
import { DEPORTES_ROSCOS } from './data/deportes.js';
import { DEPORTES_EXTRA_ROSCOS } from './data/deportesExtra.js';

export const PRESET_ROSCOS: Rosco[] = [
  ...CULTURA_GENERAL_ROSCOS,
  ...CULTURA_GENERAL_FACIL_EXTRA_ROSCOS,
  ...CULTURA_GENERAL_MEDIO_ROSCOS,
  ...CULTURA_GENERAL_DIFICIL_EXTRA_ROSCOS,
  ...ANIMALES_ROSCOS,
  ...ANIMALES_EXTRA_ROSCOS,
  ...CINE_ROSCOS,
  ...CINE_EXTRA_ROSCOS,
  ...GEOGRAFIA_ROSCOS,
  ...GEOGRAFIA_EXTRA_ROSCOS,
  ...CIENCIA_ROSCOS,
  ...CIENCIA_EXTRA_ROSCOS,
  ...HISTORIA_ROSCOS,
  ...HISTORIA_EXTRA_ROSCOS,
  ...DEPORTES_ROSCOS,
  ...DEPORTES_EXTRA_ROSCOS,
];

export function getPresetById(id: string): Rosco | undefined {
  return PRESET_ROSCOS.find((r) => r.id === id);
}
