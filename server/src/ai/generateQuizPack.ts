import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';
import type { Difficulty, QuizQuestion } from '@rosco/shared';

const MODEL = process.env.ROSCO_AI_MODEL || 'claude-sonnet-5';

export class QuizGenerationError extends Error {}

interface RawQuestionEntry {
  question: string;
  options: string[];
  correctIndex: number;
}

function buildPrompt(theme: string, difficulty: Difficulty, count: number): string {
  const difficultyHint =
    difficulty === 'medio'
      ? 'dificultad intermedia, para el público general'
      : 'dificultad difícil, para expertos o muy aficionados al tema';

  return `Genera ${count} preguntas de trivia tipo test en español sobre el tema: "${theme}".

Dificultad: ${difficulty} (${difficultyHint}).

Reglas estrictas:
- Cada pregunta debe tener EXACTAMENTE 4 opciones de respuesta, y solo una debe ser correcta.
- Las 3 opciones incorrectas deben ser plausibles (del mismo tipo/categoría que la correcta) pero claramente erróneas para quien sepa el tema.
- Las preguntas deben ser autocontenidas, claras y sin ambigüedad, en español.
- No repitas ninguna pregunta ni reutilices las mismas 4 opciones en preguntas distintas.

Responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin bloques de código) con esta forma exacta:
{"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0}, ...]}

El array "questions" debe tener exactamente ${count} elementos. "correctIndex" es la posición (0, 1, 2 o 3) de la respuesta correcta dentro de "options".`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new QuizGenerationError('La IA no devolvió un JSON válido.');
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    throw new QuizGenerationError('No se pudo interpretar la respuesta de la IA.');
  }
}

function toQuizQuestions(raw: unknown, difficulty: Difficulty, count: number): QuizQuestion[] {
  if (typeof raw !== 'object' || raw === null || !('questions' in raw)) {
    throw new QuizGenerationError('Formato de respuesta de la IA inesperado.');
  }
  const questions = (raw as { questions: unknown }).questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new QuizGenerationError('La IA no devolvió ninguna pregunta.');
  }

  const seen = new Set<string>();
  const result: QuizQuestion[] = [];
  for (const raw of questions.slice(0, count)) {
    const entry = raw as Partial<RawQuestionEntry> | undefined;
    if (!entry || typeof entry.question !== 'string' || !Array.isArray(entry.options)) {
      continue;
    }
    const question = entry.question.trim();
    const options = entry.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
    if (!question || options.length !== 4) continue;
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
    if (typeof entry.correctIndex !== 'number' || !Number.isInteger(entry.correctIndex)) continue;
    if (entry.correctIndex < 0 || entry.correctIndex > 3) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: `ai-${nanoid(6)}`,
      question,
      options: options as [string, string, string, string],
      correctIndex: entry.correctIndex as 0 | 1 | 2 | 3,
      difficulty,
    });
  }

  if (result.length < 5) {
    throw new QuizGenerationError('La IA no devolvió suficientes preguntas válidas. Inténtalo de nuevo.');
  }
  return result;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new QuizGenerationError(
      'La generación de preguntas con IA no está configurada: falta ANTHROPIC_API_KEY en el servidor.',
    );
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

async function requestQuestionsFromModel(theme: string, difficulty: Difficulty, count: number): Promise<QuizQuestion[]> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(theme, difficulty, count) }],
  });
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new QuizGenerationError('La IA no devolvió texto.');
  }
  const parsed = extractJson(textBlock.text);
  return toQuizQuestions(parsed, difficulty, count);
}

export async function generateQuizPackWithAI(theme: string, difficulty: Difficulty, count: number): Promise<QuizQuestion[]> {
  const cleanTheme = theme.trim().slice(0, 120);
  if (!cleanTheme) {
    throw new QuizGenerationError('Indica un tema para generar el paquete.');
  }

  try {
    return await requestQuestionsFromModel(cleanTheme, difficulty, count);
  } catch (err) {
    if (err instanceof QuizGenerationError) {
      // Un reintento: los modelos a veces fallan el formato a la primera.
      return await requestQuestionsFromModel(cleanTheme, difficulty, count);
    }
    throw err;
  }
}
