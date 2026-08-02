import type { CrosswordPuzzle } from '@rosco/shared';

/**
 * Crucigramas de cultura general (mezcla de geografía, ciencia, historia, arte, deporte...,
 * igual que los bancos de "cultura general" de Pasapalabra y Quiz — nada de temática única),
 * escritos a mano en forma de "peine": una palabra horizontal (la 1-Across) atraviesa toda la
 * fila 0, y de cada una de sus letras cuelga una palabra vertical distinta. Así se garantiza
 * por construcción que las letras de los cruces coinciden, sin un generador automático.
 */
export const CROSSWORD_PRESETS: CrosswordPuzzle[] = [
  {
    id: 'cultura-general-1',
    title: 'Cultura general 1',
    difficulty: 'medio',
    rows: 8,
    cols: 8,
    clues: [
      { id: 'cg1-1a', number: 1, direction: 'across', row: 0, col: 0, length: 8, answer: 'PELICULA', clue: 'Obra que se ve en el cine, con actores y una historia' },
      { id: 'cg1-1d', number: 1, direction: 'down', row: 0, col: 0, length: 5, answer: 'PARIS', clue: 'Capital de Francia' },
      { id: 'cg1-2d', number: 2, direction: 'down', row: 0, col: 1, length: 7, answer: 'ECUADOR', clue: 'País de Sudamérica atravesado por la línea del mismo nombre' },
      { id: 'cg1-3d', number: 3, direction: 'down', row: 0, col: 2, length: 4, answer: 'LEON', clue: 'Felino conocido como el rey de la selva' },
      { id: 'cg1-4d', number: 4, direction: 'down', row: 0, col: 3, length: 6, answer: 'ITALIA', clue: 'País europeo con forma de bota' },
      { id: 'cg1-5d', number: 5, direction: 'down', row: 0, col: 4, length: 7, answer: 'CORAZON', clue: 'Órgano que bombea la sangre por el cuerpo' },
      { id: 'cg1-6d', number: 6, direction: 'down', row: 0, col: 5, length: 7, answer: 'URUGUAY', clue: 'País sudamericano cuya capital es Montevideo' },
      { id: 'cg1-7d', number: 7, direction: 'down', row: 0, col: 6, length: 4, answer: 'LUNA', clue: 'Satélite natural de la Tierra' },
      { id: 'cg1-8d', number: 8, direction: 'down', row: 0, col: 7, length: 8, answer: 'AMAZONAS', clue: 'El río más caudaloso del mundo, en Sudamérica' },
    ],
  },
  {
    id: 'cultura-general-2',
    title: 'Cultura general 2',
    difficulty: 'medio',
    rows: 7,
    cols: 8,
    clues: [
      { id: 'cg2-1a', number: 1, direction: 'across', row: 0, col: 0, length: 8, answer: 'GUITARRA', clue: 'Instrumento musical de cuerda que se toca con los dedos o una púa' },
      { id: 'cg2-1d', number: 1, direction: 'down', row: 0, col: 0, length: 4, answer: 'GOYA', clue: "Pintor español autor de 'La maja desnuda'" },
      { id: 'cg2-2d', number: 2, direction: 'down', row: 0, col: 1, length: 5, answer: 'URANO', clue: 'Planeta conocido por su color azul verdoso y sus anillos' },
      { id: 'cg2-3d', number: 3, direction: 'down', row: 0, col: 2, length: 7, answer: 'IGLESIA', clue: 'Edificio dedicado al culto cristiano' },
      { id: 'cg2-4d', number: 4, direction: 'down', row: 0, col: 3, length: 5, answer: 'TENIS', clue: 'Deporte que se juega con raqueta y pelota sobre una pista' },
      { id: 'cg2-5d', number: 5, direction: 'down', row: 0, col: 4, length: 4, answer: 'ASIA', clue: 'El continente más grande y poblado del mundo' },
      { id: 'cg2-6d', number: 6, direction: 'down', row: 0, col: 5, length: 5, answer: 'RATON', clue: 'Pequeño roedor, también periférico de un ordenador' },
      { id: 'cg2-7d', number: 7, direction: 'down', row: 0, col: 6, length: 3, answer: 'REY', clue: 'Monarca que gobierna un reino' },
      { id: 'cg2-8d', number: 8, direction: 'down', row: 0, col: 7, length: 4, answer: 'AZUL', clue: 'Color del cielo despejado' },
    ],
  },
  {
    id: 'cultura-general-3',
    title: 'Cultura general 3',
    difficulty: 'dificil',
    rows: 9,
    cols: 10,
    clues: [
      { id: 'cg3-1a', number: 1, direction: 'across', row: 0, col: 0, length: 10, answer: 'ARQUITECTO', clue: 'Profesional que diseña edificios y planos de construcción' },
      { id: 'cg3-1d', number: 1, direction: 'down', row: 0, col: 0, length: 9, answer: 'ANTARTIDA', clue: 'Continente helado situado en el polo sur' },
      { id: 'cg3-2d', number: 2, direction: 'down', row: 0, col: 1, length: 9, answer: 'REPUBLICA', clue: 'Forma de gobierno sin monarca, con un presidente elegido' },
      { id: 'cg3-3d', number: 3, direction: 'down', row: 0, col: 2, length: 7, answer: 'QUIMICA', clue: 'Ciencia que estudia la composición y las reacciones de la materia' },
      { id: 'cg3-4d', number: 4, direction: 'down', row: 0, col: 3, length: 6, answer: 'URANIO', clue: 'Elemento químico radiactivo usado como combustible nuclear' },
      { id: 'cg3-5d', number: 5, direction: 'down', row: 0, col: 4, length: 7, answer: 'IMPERIO', clue: 'Territorio gobernado por un emperador' },
      { id: 'cg3-6d', number: 6, direction: 'down', row: 0, col: 5, length: 8, answer: 'TRAGEDIA', clue: 'Obra dramática con final desdichado' },
      { id: 'cg3-7d', number: 7, direction: 'down', row: 0, col: 6, length: 7, answer: 'ECLIPSE', clue: 'Fenómeno en el que un astro oculta a otro' },
      { id: 'cg3-8d', number: 8, direction: 'down', row: 0, col: 7, length: 6, answer: 'COMETA', clue: 'Cuerpo celeste con una cola brillante de gas y polvo' },
      { id: 'cg3-9d', number: 9, direction: 'down', row: 0, col: 8, length: 7, answer: 'TSUNAMI', clue: 'Ola gigante causada normalmente por un terremoto submarino' },
      { id: 'cg3-10d', number: 10, direction: 'down', row: 0, col: 9, length: 5, answer: 'OZONO', clue: 'Gas cuya capa protege la Tierra de la radiación ultravioleta' },
    ],
  },
  {
    id: 'cultura-general-4',
    title: 'Cultura general 4',
    difficulty: 'dificil',
    rows: 8,
    cols: 9,
    clues: [
      { id: 'cg4-1a', number: 1, direction: 'across', row: 0, col: 0, length: 9, answer: 'FILOSOFIA', clue: 'Disciplina que reflexiona sobre la existencia, el conocimiento y la ética' },
      { id: 'cg4-1d', number: 1, direction: 'down', row: 0, col: 0, length: 6, answer: 'FARAON', clue: 'Título de los antiguos gobernantes de Egipto' },
      { id: 'cg4-2d', number: 2, direction: 'down', row: 0, col: 1, length: 6, answer: 'IDIOMA', clue: 'Sistema de comunicación propio de una comunidad, como el español o el inglés' },
      { id: 'cg4-3d', number: 3, direction: 'down', row: 0, col: 2, length: 7, answer: 'LATITUD', clue: 'Distancia angular de un punto de la Tierra respecto al ecuador' },
      { id: 'cg4-4d', number: 4, direction: 'down', row: 0, col: 3, length: 8, answer: 'ORQUESTA', clue: 'Conjunto numeroso de músicos que tocan instrumentos variados' },
      { id: 'cg4-5d', number: 5, direction: 'down', row: 0, col: 4, length: 8, answer: 'SOCRATES', clue: 'Filósofo griego considerado el padre de la filosofía occidental' },
      { id: 'cg4-6d', number: 6, direction: 'down', row: 0, col: 5, length: 5, answer: 'OXIDO', clue: 'Compuesto que resulta de la combinación de un elemento con el oxígeno' },
      { id: 'cg4-7d', number: 7, direction: 'down', row: 0, col: 6, length: 5, answer: 'FOSIL', clue: 'Resto de un ser vivo conservado desde hace miles o millones de años' },
      { id: 'cg4-8d', number: 8, direction: 'down', row: 0, col: 7, length: 5, answer: 'ISLAM', clue: 'Religión monoteísta fundada por Mahoma' },
      { id: 'cg4-9d', number: 9, direction: 'down', row: 0, col: 8, length: 8, answer: 'ALQUIMIA', clue: 'Antigua práctica que buscaba transformar metales en oro' },
    ],
  },
];
