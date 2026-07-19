import {
  ROSCO_ALPHABET,
  answerMatchesLetterRule,
  defaultMatchTypeForLetter,
  type LetterClue,
  type Rosco,
} from '@rosco/shared';

/**
 * Builds a Rosco from 25 [clue, answer] tuples in ROSCO_ALPHABET order
 * (A,B,C,D,E,F,G,H,I,J,L,M,N,Ñ,O,P,Q,R,S,T,U,V,X,Y,Z — no K, no W).
 * Throws at import time if an answer breaks the letter's starts/contains rule,
 * so any mistake is caught immediately by the build instead of at runtime.
 */
export function buildRosco(
  id: string,
  title: string,
  difficulty: Rosco['difficulty'],
  theme: string,
  entries: [clue: string, answer: string][],
): Rosco {
  if (entries.length !== ROSCO_ALPHABET.length) {
    throw new Error(
      `Rosco "${id}" debe tener ${ROSCO_ALPHABET.length} pistas, tiene ${entries.length}`,
    );
  }
  const seenAnswers = new Set<string>();
  const letters: LetterClue[] = ROSCO_ALPHABET.map((letter, i) => {
    const [clue, answer] = entries[i];
    const matchType = defaultMatchTypeForLetter(letter);
    if (!answerMatchesLetterRule(answer, letter, matchType)) {
      throw new Error(
        `Rosco "${id}": la respuesta "${answer}" no cumple la regla de la letra "${letter}" (${matchType})`,
      );
    }
    const normalized = answer.trim().toLowerCase();
    if (seenAnswers.has(normalized)) {
      throw new Error(`Rosco "${id}": la respuesta "${answer}" está repetida dentro del mismo rosco.`);
    }
    seenAnswers.add(normalized);
    return { letter, clue, answer, matchType };
  });
  return { id, title, difficulty, theme, letters, source: 'preset' };
}
