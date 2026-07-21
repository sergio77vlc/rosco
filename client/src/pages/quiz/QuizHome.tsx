import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuizHome() {
  const navigate = useNavigate();
  return (
    <div className="screen screen-center">
      <button className="back-to-hub-link" onClick={() => navigate('/')}>
        ← Todos los juegos
      </button>
      <h1 className="app-title">🧠 Quiz de Cultura General</h1>
      <p className="app-subtitle">Responde más rápido que nadie, estilo Kahoot. Multijugador con tus amigos y sus móviles.</p>
      <div className="home-actions">
        <button className="btn btn-primary btn-big" onClick={() => navigate('/quiz/host')}>
          Hospedar partida
        </button>
        <button className="btn btn-secondary btn-big" onClick={() => navigate('/quiz/join')}>
          Unirse a una partida
        </button>
      </div>
    </div>
  );
}
