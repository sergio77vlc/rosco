import type { Rosco } from '@rosco/shared';
import { buildRosco } from '../builder.js';

export const DEPORTES_ROSCOS: Rosco[] = [
  buildRosco('deportes-dificil', 'Deportes (difícil) I', 'dificil', 'deportes', [
    ['Deporte de pista con vallas, saltos y lanzamientos; incluye pruebas como los 100 metros lisos.', 'atletismo'],
    ['Deporte de equipo en el que se encesta un balón en un aro elevado.', 'baloncesto'],
    ['Deporte que se practica sobre una bicicleta, como el Tour de Francia.', 'ciclismo'],
    ['Acción de avanzar botando el balón sin perder su control, típica del baloncesto y el fútbol.', 'dribbling'],
    ['Deporte de combate con espadas en el que hay que tocar al rival sin ser tocado.', 'esgrima'],
    ['Deporte de equipo más popular del mundo; se juega con los pies y un balón buscando marcar goles.', 'fútbol'],
    ['Deporte en el que se golpea una pequeña bola con palos intentando meterla en hoyos.', 'golf'],
    ['Deporte de equipo sobre hielo que se juega con un disco (puck) y bastones.', 'hockey'],
    ['En judo, puntuación máxima que se otorga por una técnica perfecta y gana el combate al instante.', 'ippon'],
    ['Deporte de combate de origen japonés en el que se busca derribar al rival usando su propia fuerza.', 'judo'],
    ['Prueba de atletismo en la que se arroja lo más lejos posible un disco de metal.', 'lanzamiento de disco'],
    ['Carrera de atletismo de 42,195 kilómetros de distancia.', 'maratón'],
    ['Deporte que se practica en el agua desplazándose mediante el movimiento de brazos y piernas.', 'natación'],
    ['Cada uno de los periodos de 365 días que separan una edición de los Juegos Olímpicos de la siguiente.', 'año'],
    ['Competición deportiva internacional que se celebra cada cuatro años, reuniendo a atletas de todo el mundo.', 'Olimpiadas'],
    ['Deporte de raqueta que se juega en una pista dividida por una red, similar al tenis pero con pala.', 'pádel'],
    ['Posición del fútbol americano encargada de organizar el ataque y lanzar el balón a sus compañeros.', 'quarterback'],
    ['Deporte de equipo de origen inglés que se juega con un balón ovalado que se puede llevar con las manos.', 'rugby'],
    ['Deporte de tabla que se practica sobre las olas del mar.', 'surf'],
    ['Deporte de raqueta con pelota amarilla que se juega en una pista dividida por una red.', 'tenis'],
    ['Atuendo idéntico que visten los deportistas de un mismo equipo.', 'uniforme'],
    ['Deporte de equipo en el que se golpea un balón con las manos por encima de una red sin que toque el suelo.', 'voleibol'],
    ['Nombre genérico de los deportes de riesgo y adrenalina, como el skate o el BMX: deportes ...', 'extremos'],
    ['Nombre españolizado del jinete profesional que monta caballos de carreras.', 'yóquey'],
    ['Acción de lanzarse de cabeza o de pie al agua, fundamental en la natación y los clavados.', 'zambullida'],
  ]),
];
