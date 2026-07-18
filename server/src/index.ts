import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { Difficulty } from '@rosco/shared';
import { PRESET_ROSCOS } from './roscos/presets.js';
import { generateRoscoWithAI, RoscoGenerationError } from './ai/generateRosco.js';
import { registerSocketHandlers } from './socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const clientDist = path.join(__dirname, '../../client/dist');
const hasClientBuild = existsSync(path.join(clientDist, 'index.html'));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/rosco/presets', (_req, res) => {
  res.json({ roscos: PRESET_ROSCOS });
});

app.post('/api/rosco/generate', async (req, res) => {
  const { theme, difficulty } = req.body ?? {};
  const validDifficulties: Difficulty[] = ['facil', 'medio', 'dificil'];
  if (typeof theme !== 'string' || !validDifficulties.includes(difficulty)) {
    res.status(400).json({ error: 'Petición inválida: falta "theme" o "difficulty" no es válido.' });
    return;
  }
  try {
    const rosco = await generateRoscoWithAI(theme, difficulty);
    res.json({ rosco });
  } catch (err) {
    if (err instanceof RoscoGenerationError) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error('Error generando rosco con IA:', err);
    res.status(500).json({ error: 'Error inesperado generando el rosco.' });
  }
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
});

httpServer.listen(PORT, () => {
  console.log(
    `Servidor Rosco escuchando en el puerto ${PORT}${hasClientBuild ? ' (sirviendo cliente compilado)' : ''}`,
  );
});
