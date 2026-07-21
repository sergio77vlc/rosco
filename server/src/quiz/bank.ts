import type { QuizQuestion } from '@rosco/shared';

const MIN_BANK_SIZE = 20;

/**
 * Valida un banco de preguntas de quiz al importarlo: ids únicos, exactamente 4 opciones sin
 * huecos, índice de respuesta correcta dentro de rango, y sin preguntas repetidas. Lanza un
 * error inmediato si algo no cumple, igual que `buildQuestionBank` para los roscos.
 */
export function buildQuizBank(id: string, bank: QuizQuestion[]): QuizQuestion[] {
  if (bank.length < MIN_BANK_SIZE) {
    throw new Error(`Banco de quiz "${id}": necesita al menos ${MIN_BANK_SIZE} preguntas.`);
  }
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();
  for (const q of bank) {
    if (!q.id || seenIds.has(q.id)) {
      throw new Error(`Banco de quiz "${id}": id duplicado o vacío ("${q.id}").`);
    }
    seenIds.add(q.id);
    if (!q.question?.trim()) {
      throw new Error(`Banco de quiz "${id}": pregunta vacía (${q.id}).`);
    }
    const normalizedQuestion = q.question.trim().toLowerCase();
    if (seenQuestions.has(normalizedQuestion)) {
      throw new Error(`Banco de quiz "${id}": pregunta repetida ("${q.question}").`);
    }
    seenQuestions.add(normalizedQuestion);
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !o?.trim())) {
      throw new Error(`Banco de quiz "${id}": debe tener exactamente 4 opciones no vacías (${q.id}).`);
    }
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) {
      throw new Error(`Banco de quiz "${id}": las 4 opciones deben ser distintas entre sí (${q.id}).`);
    }
    if (![0, 1, 2, 3].includes(q.correctIndex)) {
      throw new Error(`Banco de quiz "${id}": correctIndex fuera de rango (${q.id}).`);
    }
  }
  return bank;
}
