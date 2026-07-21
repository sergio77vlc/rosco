import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GameEntry {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  githubUrl: string;
}

const GAMES: GameEntry[] = [
  {
    id: 'pasapalabra',
    name: 'Pasapalabra',
    icon: '🎯',
    description: 'El clásico rosco de preguntas y respuestas, multijugador con tus amigos y sus móviles.',
    path: '/pasapalabra',
    githubUrl: 'https://github.com/sergio77vlc/socialquizz',
  },
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '🧠',
    description: 'Preguntas de cultura general a contrarreloj, estilo Kahoot: quien más rápido acierta, más puntos gana.',
    path: '/quiz',
    githubUrl: 'https://github.com/sergio77vlc/socialquizz',
  },
];

export default function GamesHub() {
  const navigate = useNavigate();

  return (
    <div className="screen screen-center">
      <h1 className="app-title">🧩 SocialQuizz</h1>
      <p className="app-subtitle">Juegos educativos multijugador para jugar con amigos, familia o clase. Elige a qué quieres jugar.</p>

      <div className="games-grid">
        {GAMES.map((game) => (
          <div key={game.id} className="game-card">
            <span className="game-card-icon">{game.icon}</span>
            <h2 className="game-card-name">{game.name}</h2>
            <p className="game-card-description">{game.description}</p>
            <div className="game-card-actions">
              <button className="btn btn-primary" onClick={() => navigate(game.path)}>
                ▶️ Jugar
              </button>
              <a
                className="btn btn-secondary"
                href={game.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                🐙 GitHub
              </a>
            </div>
          </div>
        ))}

        <div className="game-card game-card-placeholder">
          <span className="game-card-icon">➕</span>
          <h2 className="game-card-name">Próximamente</h2>
          <p className="game-card-description">Aquí aparecerá el próximo juego.</p>
        </div>
      </div>
    </div>
  );
}
