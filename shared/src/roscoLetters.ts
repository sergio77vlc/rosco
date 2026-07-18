export const ROSCO_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N',
  'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
] as const;

export type RoscoLetter = (typeof ROSCO_ALPHABET)[number];

export const ROSCO_LENGTH = ROSCO_ALPHABET.length;

/** Letters where "contiene la ..." (contains) is the conventional clue style. */
export const DEFAULT_CONTAINS_LETTERS: ReadonlySet<RoscoLetter> = new Set(['Ñ', 'X']);

export function defaultMatchTypeForLetter(letter: string): 'starts' | 'contains' {
  return DEFAULT_CONTAINS_LETTERS.has(letter as RoscoLetter) ? 'contains' : 'starts';
}
