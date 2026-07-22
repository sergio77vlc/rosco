import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import type { Difficulty, PackDomain, PackSummary, QuizDifficulty, QuizPack, RoscoPack } from '@rosco/shared';
import { drawRoscos } from './roscos/pool.js';
import { drawQuizQuestions } from './quiz/pool.js';
import { generateRoscoPack } from './ai/generateRosco.js';
import { generateQuizPackWithAI, QuizGenerationError } from './ai/generateQuizPack.js';
import { RoscoGenerationError } from './ai/generateRosco.js';
import { roscoPackRepo, quizPackRepo, battlePackRepo } from './packs/repositories.js';
import { registerSocketHandlers } from './socketHandlers.js';
import { registerQuizSocketHandlers } from './quizSocketHandlers.js';
import { registerBattleSocketHandlers } from './battleSocketHandlers.js';
import { registerCrosswordSocketHandlers } from './crosswordSocketHandlers.js';
import { listCrosswordSummaries, getCrosswordPuzzle } from './crossword/pool.js';

const VALID_DIFFICULTIES: Difficulty[] = ['medio', 'dificil'];
const MAX_DRAW_COUNT = 6;
const VALID_QUIZ_DIFFICULTIES: QuizDifficulty[] = ['medio', 'dificil', 'mixto'];
const MAX_QUIZ_DRAW_COUNT = 150;
const VALID_PACK_DOMAINS: PackDomain[] = ['rosco', 'quiz', 'battle'];
const ROSCO_PACK_SIZE = 6;
const QUIZ_PACK_SIZE = 20;

function packRepoFor(domain: PackDomain) {
  return domain === 'rosco' ? roscoPackRepo : domain === 'quiz' ? quizPackRepo : battlePackRepo;
}

function toSummary(pack: RoscoPack | QuizPack): PackSummary {
  return {
    id: pack.id,
    name: pack.name,
    difficulty: pack.difficulty,
    createdAt: pack.createdAt,
    count: 'roscos' in pack ? pack.roscos.length : pack.questions.length,
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const clientDist = path.join(__dirname, '../../client/dist');
const hasClientBuild = existsSync(path.join(clientDist, 'index.html'));

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/rosco/draw', (req, res) => {
  const { difficulty, count } = req.body ?? {};
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: 'Petición inválida: "difficulty" no es válida.' });
    return;
  }
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n < 1 || n > MAX_DRAW_COUNT) {
    res.status(400).json({ error: `"count" debe ser un número entre 1 y ${MAX_DRAW_COUNT}.` });
    return;
  }
  res.json({ roscos: drawRoscos(difficulty as Difficulty, n) });
});

app.post('/api/quiz/draw', (req, res) => {
  const { difficulty, count } = req.body ?? {};
  if (!VALID_QUIZ_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: 'Petición inválida: "difficulty" no es válida.' });
    return;
  }
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n < 1 || n > MAX_QUIZ_DRAW_COUNT) {
    res.status(400).json({ error: `"count" debe ser un número entre 1 y ${MAX_QUIZ_DRAW_COUNT}.` });
    return;
  }
  res.json({ questions: drawQuizQuestions(difficulty as QuizDifficulty, n) });
});

app.get('/api/packs/:domain', (req, res) => {
  const domain = req.params.domain as PackDomain;
  if (!VALID_PACK_DOMAINS.includes(domain)) {
    res.status(400).json({ error: 'Dominio de paquete no válido.' });
    return;
  }
  const packs = packRepoFor(domain).list() as (RoscoPack | QuizPack)[];
  res.json({ packs: packs.map(toSummary) });
});

app.get('/api/packs/:domain/:id', (req, res) => {
  const domain = req.params.domain as PackDomain;
  if (!VALID_PACK_DOMAINS.includes(domain)) {
    res.status(400).json({ error: 'Dominio de paquete no válido.' });
    return;
  }
  const pack = packRepoFor(domain).get(req.params.id);
  if (!pack) {
    res.status(404).json({ error: 'Paquete no encontrado.' });
    return;
  }
  res.json({ pack });
});

app.post('/api/packs/:domain/generate', async (req, res) => {
  const domain = req.params.domain as PackDomain;
  if (!VALID_PACK_DOMAINS.includes(domain)) {
    res.status(400).json({ error: 'Dominio de paquete no válido.' });
    return;
  }
  const { theme, difficulty } = req.body ?? {};
  if (typeof theme !== 'string' || !VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: 'Petición inválida: falta "theme" o "difficulty" no es válido.' });
    return;
  }
  try {
    if (domain === 'rosco') {
      const roscos = await generateRoscoPack(theme, difficulty, ROSCO_PACK_SIZE);
      const pack: RoscoPack = {
        id: `pack-${nanoid(8)}`,
        domain: 'rosco',
        name: theme.trim().slice(0, 120),
        difficulty,
        createdAt: Date.now(),
        roscos,
      };
      roscoPackRepo.add(pack);
      res.json({ pack: toSummary(pack) });
    } else {
      const questions = await generateQuizPackWithAI(theme, difficulty, QUIZ_PACK_SIZE);
      const pack: QuizPack = {
        id: `pack-${nanoid(8)}`,
        domain,
        name: theme.trim().slice(0, 120),
        difficulty,
        createdAt: Date.now(),
        questions,
      };
      (domain === 'quiz' ? quizPackRepo : battlePackRepo).add(pack);
      res.json({ pack: toSummary(pack) });
    }
  } catch (err) {
    if (err instanceof RoscoGenerationError || err instanceof QuizGenerationError) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error(`Error generando paquete de IA (${domain}):`, err);
    res.status(500).json({ error: 'Error inesperado generando el paquete.' });
  }
});

app.get('/api/crossword/puzzles', (_req, res) => {
  res.json({ puzzles: listCrosswordSummaries() });
});

// Solo para el modo local (un jugador en este dispositivo): incluye las respuestas, ya que
// no hay servidor de por medio validando cada palabra. En partidas en red nunca se exponen.
app.get('/api/crossword/puzzles/:id', (req, res) => {
  const puzzle = getCrosswordPuzzle(req.params.id);
  if (!puzzle) {
    res.status(404).json({ error: 'Crucigrama no encontrado.' });
    return;
  }
  res.json({ puzzle });
});

if (hasClientBuild) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn(
    'Aviso: no se encontró client/dist. Ejecuta "npm run build" antes de "npm start" para servir la web.',
  );
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
  registerQuizSocketHandlers(io, socket);
  registerBattleSocketHandlers(io, socket);
  registerCrosswordSocketHandlers(io, socket);
});

httpServer.listen(PORT, HOST, () => {
  console.log(
    `Servidor SocialQuizz escuchando en ${HOST}:${PORT}${hasClientBuild ? ' (sirviendo cliente compilado)' : ''}`,
  );
});
