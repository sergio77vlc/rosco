import type { CrosswordPuzzle } from '@rosco/shared';

/**
 * Crucigramas de ejemplo, escritos a mano en forma de "peine": una palabra horizontal
 * (la 1-Across) atraviesa toda la fila 0, y de cada una de sus letras cuelga una palabra
 * vertical distinta. Así se garantiza por construcción que las letras de los cruces
 * coinciden, sin necesidad de un generador automático de crucigramas.
 */
export const CROSSWORD_PRESETS: CrosswordPuzzle[] = [
  {
    id: 'animales-naturaleza',
    title: 'Animales y naturaleza',
    difficulty: 'medio',
    rows: 7,
    cols: 8,
    clues: [
      { id: 'an-1a', number: 1, direction: 'across', row: 0, col: 0, length: 8, answer: 'ELEFANTE', clue: 'Mamífero de gran tamaño con trompa' },
      { id: 'an-1d', number: 1, direction: 'down', row: 0, col: 0, length: 5, answer: 'ENERO', clue: 'Primer mes del año' },
      { id: 'an-2d', number: 2, direction: 'down', row: 0, col: 1, length: 5, answer: 'LIBRO', clue: 'Se lee y tiene páginas' },
      { id: 'an-3d', number: 3, direction: 'down', row: 0, col: 2, length: 6, answer: 'EUROPA', clue: 'Continente donde están España, Francia e Italia' },
      { id: 'an-4d', number: 4, direction: 'down', row: 0, col: 3, length: 4, answer: 'FLOR', clue: 'Parte de la planta con pétalos que suele oler bien' },
      { id: 'an-5d', number: 5, direction: 'down', row: 0, col: 4, length: 5, answer: 'ARBOL', clue: 'Tiene tronco, ramas y hojas' },
      { id: 'an-6d', number: 6, direction: 'down', row: 0, col: 5, length: 7, answer: 'NARANJA', clue: 'Fruta cítrica del mismo color que su nombre' },
      { id: 'an-7d', number: 7, direction: 'down', row: 0, col: 6, length: 5, answer: 'TIGRE', clue: 'Felino grande de rayas negras y naranjas' },
      { id: 'an-8d', number: 8, direction: 'down', row: 0, col: 7, length: 7, answer: 'ESCUELA', clue: 'Lugar donde se estudia de niño' },
    ],
  },
  {
    id: 'vida-cotidiana',
    title: 'Vida cotidiana',
    difficulty: 'medio',
    rows: 6,
    cols: 8,
    clues: [
      { id: 'vc-1a', number: 1, direction: 'across', row: 0, col: 0, length: 8, answer: 'ENSALADA', clue: 'Plato frío con lechuga, tomate y otros vegetales' },
      { id: 'vc-1d', number: 1, direction: 'down', row: 0, col: 0, length: 6, answer: 'ELEGIR', clue: 'Escoger entre varias opciones' },
      { id: 'vc-2d', number: 2, direction: 'down', row: 0, col: 1, length: 4, answer: 'NUBE', clue: 'Se ve en el cielo y a veces trae lluvia' },
      { id: 'vc-3d', number: 3, direction: 'down', row: 0, col: 2, length: 5, answer: 'SILLA', clue: 'Mueble para sentarse' },
      { id: 'vc-4d', number: 4, direction: 'down', row: 0, col: 3, length: 5, answer: 'AMIGO', clue: 'Persona en la que confías y con la que compartes tiempo' },
      { id: 'vc-5d', number: 5, direction: 'down', row: 0, col: 4, length: 4, answer: 'LUNA', clue: 'Satélite natural de la Tierra' },
      { id: 'vc-6d', number: 6, direction: 'down', row: 0, col: 5, length: 4, answer: 'AGUA', clue: 'Líquido incoloro esencial para vivir' },
      { id: 'vc-7d', number: 7, direction: 'down', row: 0, col: 6, length: 4, answer: 'DEDO', clue: 'Cada una de las partes que forman la mano o el pie' },
      { id: 'vc-8d', number: 8, direction: 'down', row: 0, col: 7, length: 5, answer: 'AVION', clue: 'Vehículo que vuela y transporta pasajeros' },
    ],
  },
  {
    id: 'astronomia',
    title: 'Astronomía',
    difficulty: 'dificil',
    rows: 9,
    cols: 10,
    clues: [
      { id: 'as-1a', number: 1, direction: 'across', row: 0, col: 0, length: 10, answer: 'ASTRONOMIA', clue: 'Ciencia que estudia los astros y el universo' },
      { id: 'as-1d', number: 1, direction: 'down', row: 0, col: 0, length: 6, answer: 'AZUFRE', clue: 'Elemento químico amarillo de número atómico 16' },
      { id: 'as-2d', number: 2, direction: 'down', row: 0, col: 1, length: 8, answer: 'SATELITE', clue: 'Objeto que orbita alrededor de un planeta' },
      { id: 'as-3d', number: 3, direction: 'down', row: 0, col: 2, length: 7, answer: 'TORNADO', clue: 'Columna de aire que gira violentamente' },
      { id: 'as-4d', number: 4, direction: 'down', row: 0, col: 3, length: 4, answer: 'RUBI', clue: 'Piedra preciosa de color rojo' },
      { id: 'as-5d', number: 5, direction: 'down', row: 0, col: 4, length: 7, answer: 'OXIGENO', clue: 'Elemento químico esencial para respirar' },
      { id: 'as-6d', number: 6, direction: 'down', row: 0, col: 5, length: 8, answer: 'NEBULOSA', clue: 'Nube de gas y polvo en el espacio' },
      { id: 'as-7d', number: 7, direction: 'down', row: 0, col: 6, length: 6, answer: 'ORBITA', clue: 'Trayectoria que sigue un cuerpo celeste alrededor de otro' },
      { id: 'as-8d', number: 8, direction: 'down', row: 0, col: 7, length: 7, answer: 'METEORO', clue: 'Fenómeno luminoso conocido como estrella fugaz' },
      { id: 'as-9d', number: 9, direction: 'down', row: 0, col: 8, length: 4, answer: 'IMAN', clue: 'Objeto que atrae el hierro' },
      { id: 'as-10d', number: 10, direction: 'down', row: 0, col: 9, length: 9, answer: 'ASTEROIDE', clue: 'Cuerpo rocoso más pequeño que un planeta que orbita el Sol' },
    ],
  },
  {
    id: 'mitologia-historia',
    title: 'Mitología e Historia',
    difficulty: 'dificil',
    rows: 9,
    cols: 9,
    clues: [
      { id: 'mh-1a', number: 1, direction: 'across', row: 0, col: 0, length: 9, answer: 'MITOLOGIA', clue: 'Conjunto de mitos y leyendas de una cultura' },
      { id: 'mh-1d', number: 1, direction: 'down', row: 0, col: 0, length: 5, answer: 'MOMIA', clue: 'Cuerpo conservado mediante técnicas de embalsamamiento' },
      { id: 'mh-2d', number: 2, direction: 'down', row: 0, col: 1, length: 7, answer: 'IMPERIO', clue: 'Territorio gobernado por un emperador' },
      { id: 'mh-3d', number: 3, direction: 'down', row: 0, col: 2, length: 6, answer: 'TEMPLO', clue: 'Edificio dedicado al culto religioso' },
      { id: 'mh-4d', number: 4, direction: 'down', row: 0, col: 3, length: 7, answer: 'ORACULO', clue: 'Persona o lugar que predice el futuro en la antigüedad' },
      { id: 'mh-5d', number: 5, direction: 'down', row: 0, col: 4, length: 7, answer: 'LEYENDA', clue: 'Relato tradicional que mezcla realidad y fantasía' },
      { id: 'mh-6d', number: 6, direction: 'down', row: 0, col: 5, length: 6, answer: 'OLIMPO', clue: 'Monte donde vivían los dioses griegos' },
      { id: 'mh-7d', number: 7, direction: 'down', row: 0, col: 6, length: 9, answer: 'GLADIADOR', clue: 'Luchador que combatía en la antigua Roma para entretener al público' },
      { id: 'mh-8d', number: 8, direction: 'down', row: 0, col: 7, length: 5, answer: 'ICARO', clue: 'Personaje mitológico que voló demasiado cerca del sol' },
      { id: 'mh-9d', number: 9, direction: 'down', row: 0, col: 8, length: 9, answer: 'ATLANTIDA', clue: 'Isla legendaria que se dice desapareció bajo el mar' },
    ],
  },
];
