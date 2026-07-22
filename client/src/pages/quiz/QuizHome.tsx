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
        <button type="button" className="action-card action-card-host" onClick={() => navigate('/quiz/host')}>
          <span className="action-card-icon">🎬</span>
          <span className="action-card-text">
            <span className="action-card-title">Hospedar partida</span>
            <span className="action-card-hint">Crea una sala y compártela con un código QR</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-join" onClick={() => navigate('/quiz/join')}>
          <span className="action-card-icon">📲</span>
          <span className="action-card-text">
            <span className="action-card-title">Unirse a una partida</span>
            <span className="action-card-hint">Escanea el QR o introduce el código de la sala</span>
          </span>
        </button>
      </div>
    </div>
  );
}
