import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';
import { ROSCO_ALPHABET, answerMatchesLetterRule, defaultMatchTypeForLetter } from '@rosco/shared';
import type { Difficulty, LetterClue, Rosco } from '@rosco/shared';

const MODEL = process.env.ROSCO_AI_MODEL || 'claude-sonnet-5';

export class RoscoGenerationError extends Error {}

interface RawLetterEntry {
  letter: string;
  clue: string;
  answer: string;
}

function buildPrompt(theme: string, difficulty: Difficulty): string {
  const letters = ROSCO_ALPHABET.join(', ');
  const difficultyHint =
    difficulty === 'facil'
      ? 'preguntas sencillas, de conocimiento general y accesibles para cualquier edad'
      : difficulty === 'medio'
        ? 'preguntas de dificultad intermedia, requieren cierta cultura general'
        : 'preguntas difíciles, para jugadores expertos o muy aficionados al tema';

  return `Genera un "rosco" completo en español para un juego tipo Pasapalabra sobre el tema: "${theme}".

Dificultad: ${difficulty} (${difficultyHint}).

Debes generar EXACTAMENTE una pista y una respuesta para cada una de estas ${ROSCO_ALPHABET.length} letras, en este orden exacto: ${letters}.

Reglas estrictas:
- Para cada letra, la pista debe empezar con "Con la [LETRA]: " y describir de forma clara e inequívoca una única respuesta posible.
- La respuesta debe ser una palabra o expresión corta (máximo 4 palabras), en español, sin explicaciones adicionales.
- Para todas las letras EXCEPTO "Ñ" y "X", la respuesta debe EMPEZAR por esa letra.
- Para la letra "Ñ", la respuesta debe CONTENER la letra "ñ" en cualquier posición (no hace falta que empiece por ella).
- Para la letra "X", la respuesta debe CONTENER la letra "x" en cualquier posición (no hace falta que empiece por ella).
- Relaciona las pistas con el tema "${theme}" siempre que sea razonablemente posible; si alguna letra es muy difícil de encajar en el tema, usa una palabra general en español que cumpla la regla de la letra.
- No repitas la misma respuesta en dos letras distintas.

Responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin bloques de código) con esta forma exacta:
{"letters": [{"letter": "A", "clue": "Con la A: ...", "answer": "..."}, ...]}

El array "letters" debe tener exactamente ${ROSCO_ALPHABET.length} elementos, en el mismo orden que la lista de letras indicada arriba.`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new RoscoGenerationError('La IA no devolvió un JSON válido.');
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    throw new RoscoGenerationError('No se pudo interpretar la respuesta de la IA.');
  }
}

function toLetterClues(raw: unknown): LetterClue[] {
  if (typeof raw !== 'object' || raw === null || !('letters' in raw)) {
    throw new RoscoGenerationError('Formato de respuesta de la IA inesperado.');
  }
  const letters = (raw as { letters: unknown }).letters;
  if (!Array.isArray(letters) || letters.length !== ROSCO_ALPHABET.length) {
    throw new RoscoGenerationError(`La IA debe devolver exactamente ${ROSCO_ALPHABET.length} letras.`);
  }

  return ROSCO_ALPHABET.map((expectedLetter, i) => {
    const entry = letters[i] as Partial<RawLetterEntry> | undefined;
    if (!entry || typeof entry.clue !== 'string' || typeof entry.answer !== 'string') {
      throw new RoscoGenerationError(`Falta la pista o respuesta para la letra ${expectedLetter}.`);
    }
    const matchType = defaultMatchTypeForLetter(expectedLetter);
    const answer = entry.answer.trim();
    if (!answerMatchesLetterRule(answer, expectedLetter, matchType)) {
      throw new RoscoGenerationError(
        `La respuesta "${answer}" no cumple la regla de la letra ${expectedLetter}.`,
      );
    }
    return {
      letter: expectedLetter,
      clue: entry.clue.trim(),
      answer,
      matchType,
    };
  });
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new RoscoGenerationError(
      'La generación de roscos con IA no está configurada: falta ANTHROPIC_API_KEY en el servidor.',
    );
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

async function requestRoscoFromModel(theme: string, difficulty: Difficulty): Promise<LetterClue[]> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(theme, difficulty) }],
  });
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new RoscoGenerationError('La IA no devolvió texto.');
  }
  const parsed = extractJson(textBlock.text);
  return toLetterClues(parsed);
}

export async function generateRoscoWithAI(theme: string, difficulty: Difficulty): Promise<Rosco> {
  const cleanTheme = theme.trim().slice(0, 120);
  if (!cleanTheme) {
    throw new RoscoGenerationError('Indica un tema para generar el rosco.');
  }

  let letters: LetterClue[];
  try {
    letters = await requestRoscoFromModel(cleanTheme, difficulty);
  } catch (err) {
    if (err instanceof RoscoGenerationError) {
      // Un reintento: los modelos a veces fallan el formato a la primera.
      letters = await requestRoscoFromModel(cleanTheme, difficulty);
    } else {
      throw err;
    }
  }

  return {
    id: `ai-${nanoid(8)}`,
    title: `Rosco de IA: ${cleanTheme}`,
    difficulty,
    theme: cleanTheme,
    letters,
    source: 'ai',
  };
}
