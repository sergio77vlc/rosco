import type { QuizPack, RoscoPack } from '@rosco/shared';
import { createPackRepository } from './repository.js';

// Instancias únicas (un módulo ES solo se evalúa una vez): cualquier otro archivo que importe
// de aquí comparte el mismo repositorio, ya cargado desde disco.
export const roscoPackRepo = createPackRepository<RoscoPack>('rosco');
export const quizPackRepo = createPackRepository<QuizPack>('quiz');
export const battlePackRepo = createPackRepository<QuizPack>('battle');
