const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
const ENYE_PLACEHOLDER = String.fromCharCode(1);

/**
 * Lowercases, strips accents/diacritics, trims and collapses whitespace.
 * "ñ" is protected from accent-stripping: it's a distinct Spanish letter, not
 * an accented "n" (e.g. "año" must stay different from "ano").
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .split('ñ').join(ENYE_PLACEHOLDER)
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .split(ENYE_PLACEHOLDER).join('ñ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isAnswerCorrect(submitted: string, expected: string): boolean {
  const norm = normalizeAnswer(submitted);
  if (!norm) return false;
  return norm === normalizeAnswer(expected);
}

/** Whether `answer` respects the clue's letter rule (starts with / contains the letter). */
export function answerMatchesLetterRule(
  answer: string,
  letter: string,
  matchType: 'starts' | 'contains',
): boolean {
  const normAnswer = normalizeAnswer(answer);
  const normLetter = normalizeAnswer(letter);
  if (matchType === 'starts') return normAnswer.startsWith(normLetter);
  return normAnswer.includes(normLetter);
}
