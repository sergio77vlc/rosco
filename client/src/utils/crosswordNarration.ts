/** Frases para narrar por voz (y mostrar en pantalla) cuando alguien resuelve una palabra del crucigrama. */

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

const SOLVED_LINES = [
  '¡Muy bien, {name}! {word}, {points} puntos.',
  '¡{name} acierta! La palabra era {word}.',
  '¡Eso es! {name} suma {points} puntos con {word}.',
  '¡Genial, {name}! {word}, correcto.',
  '¡{name} lo tiene claro! {word}.',
];

const FINISHED_LINES = [
  '¡Crucigrama completado! Buen trabajo a todos.',
  '¡Última palabra resuelta! Se acabó el crucigrama.',
  '¡Y con esa, el crucigrama está completo!',
];

export function pickSolvedLine(playerName: string, word: string, points: number): string {
  return fill(pickRandom(SOLVED_LINES), { name: playerName, word, points: String(points) });
}

export function pickFinishedLine(): string {
  return pickRandom(FINISHED_LINES);
}
