const MIN_CORRECT_POINTS = 500;
const MAX_CORRECT_POINTS = 1000;

/**
 * Puntos por responder a una pregunta: 0 si falla, y si acierta entre MIN y MAX puntos
 * según la rapidez (instantáneo = máximo, justo al límite del tiempo = mínimo).
 */
export function computeQuizPoints(correct: boolean, remainingMs: number, durationMs: number): number {
  if (!correct || durationMs <= 0) return 0;
  const fraction = Math.max(0, Math.min(1, remainingMs / durationMs));
  return Math.round(MIN_CORRECT_POINTS + (MAX_CORRECT_POINTS - MIN_CORRECT_POINTS) * fraction);
}
