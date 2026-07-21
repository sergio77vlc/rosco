import {
  ROSCO_ALPHABET,
  answerMatchesLetterRule,
  defaultMatchTypeForLetter,
  type RoscoLetter,
} from '@rosco/shared';

/** Pista + respuesta cruda, antes de resolver su `matchType` (se deriva de la letra). */
export type QuestionTuple = [clue: string, answer: string];

/** Banco de preguntas de una dificultad: varias preguntas candidatas por cada una de las 25 letras. */
export type QuestionBank = Record<RoscoLetter, QuestionTuple[]>;

/**
 * Valida un banco de preguntas al importarlo: exige las 25 letras presentes, que cada
 * respuesta cumpla la regla de su letra (empieza por / contiene) y que no haya respuestas
 * repetidas dentro de la misma letra. Lanza un error inmediato si algo no cumple, igual que
 * el antiguo `buildRosco` validaba los roscos fijos.
 */
export function buildQuestionBank(id: string, bank: QuestionBank): QuestionBank {
  for (const letter of ROSCO_ALPHABET) {
    const entries = bank[letter];
    if (!entries || entries.length === 0) {
      throw new Error(`Banco "${id}": falta contenido para la letra "${letter}".`);
    }
    const matchType = defaultMatchTypeForLetter(letter);
    const seenAnswers = new Set<string>();
    for (const [clue, answer] of entries) {
      if (!clue?.trim() || !answer?.trim()) {
        throw new Error(`Banco "${id}": entrada vacía en la letra "${letter}".`);
      }
      if (!answerMatchesLetterRule(answer, letter, matchType)) {
        throw new Error(
          `Banco "${id}": la respuesta "${answer}" no cumple la regla de la letra "${letter}" (${matchType}).`,
        );
      }
      const normalized = answer.trim().toLowerCase();
      if (seenAnswers.has(normalized)) {
        throw new Error(`Banco "${id}": la respuesta "${answer}" está repetida en la letra "${letter}".`);
      }
      seenAnswers.add(normalized);
    }
  }
  return bank;
}
