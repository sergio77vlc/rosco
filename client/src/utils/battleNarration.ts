/** Frases graciosas para narrar por voz (y mostrar en pantalla) el resultado de cada ataque de Batalla. */

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

const HIT_LINES: Record<string, string[]> = {
  tomate: [
    '¡{attacker} convierte a {target} en gazpacho con un tomatazo!',
    '¡Zas! {target} lleva el tomate de {attacker} pegado a la cara.',
    '{attacker} le tira un tomate a {target}... ¡diana!',
  ],
  platano: [
    '¡{target} resbala con la piel de plátano de {attacker}!',
    '{attacker} deja fuera de juego a {target} con una cáscara de plátano.',
    'Clásico donde los haya: {target} pisa el plátano de {attacker} y se pega el resbalón.',
  ],
  tarta: [
    '¡{attacker} le mete una tarta en toda la cara a {target}!',
    '{target} se lleva una tarta de nata de {attacker}... ¡qué desperdicio de postre!',
    'Nata hasta las cejas: {attacker} deja perdido a {target}.',
  ],
  punetazo: [
    '¡{attacker} le suelta un puñetazo a {target}!',
    '¡PLAF! {attacker} deja tocado a {target} de un puñetazo.',
    '{attacker} calienta motores y le cruza la cara a {target}.',
  ],
  pistola_agua: [
    '¡{attacker} deja empapado a {target} de un chorro de agua!',
    '{target} no vio venir el chorro de agua de {attacker}.',
    'Frescor total: {attacker} moja de arriba a abajo a {target}.',
  ],
  petardo: [
    '¡{attacker} le pega un petardazo a {target}!',
    'BOOM. {target} sale volando con el petardo de {attacker}.',
    '{attacker} enciende la mecha... ¡y {target} se lleva el susto de su vida!',
  ],
  bomba: [
    '¡{attacker} hace explotar a {target} con una bomba!',
    'Cuenta atrás terminada: {target} recibe la bomba de {attacker} de lleno.',
    '¡Voladura controlada! {attacker} deja a {target} entre humo y estrellitas.',
  ],
  yunque: [
    '¡Un yunque le cae encima a {target}, cortesía de {attacker}!',
    'Estilo dibujos animados: {target} queda aplastado bajo el yunque de {attacker}.',
    '{attacker} suelta un yunque desde las alturas... ¡y {target} se queda plano!',
  ],
};

const DEFEAT_SUFFIXES = [
  ' ¡Y {target} queda fuera de combate!',
  ' ¡{target} no se levanta de esta!',
  ' ¡Adiós, {target}!',
  ' ¡{target} ve las estrellitas y se retira!',
];

const MISS_LINES = [
  '{attacker} se queda pensando... y falla.',
  '¡Vaya fallo de {attacker}! Sin premio esta vez.',
  '{attacker} lo intenta, pero no acierta ni una.',
  'Se le ha ido la cabeza a {attacker}... turno perdido.',
];

/** Línea graciosa para un ataque acertado, con remate extra si deja al objetivo fuera de combate. */
export function pickAttackLine(weaponId: string, attackerName: string, targetName: string, defeated: boolean): string {
  const lines = HIT_LINES[weaponId] ?? HIT_LINES.tomate;
  const vars = { attacker: attackerName, target: targetName };
  let line = fill(pickRandom(lines), vars);
  if (defeated) line += fill(pickRandom(DEFEAT_SUFFIXES), vars);
  return line;
}

/** Línea graciosa cuando el jugador activo falla la pregunta y no llega a atacar. */
export function pickMissLine(attackerName: string): string {
  return fill(pickRandom(MISS_LINES), { attacker: attackerName });
}
