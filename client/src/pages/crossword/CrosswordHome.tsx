import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CrosswordHome() {
  const navigate = useNavigate();
  return (
    <div className="screen screen-center">
      <button className="back-to-hub-link" onClick={() => navigate('/')}>
        ← Todos los juegos
      </button>
      <h1 className="app-title">🧩 Crucigramas</h1>
      <p className="app-subtitle">
        Un mismo crucigrama para todos, en tiempo real. Sin turnos: cualquiera puede resolver
        cualquier palabra y sumar puntos. Sin límite de tiempo.
      </p>
      <div className="home-actions">
        <button type="button" className="action-card action-card-host" onClick={() => navigate('/crossword/host')}>
          <span className="action-card-icon">🎬</span>
          <span className="action-card-text">
            <span className="action-card-title">Hospedar partida</span>
            <span className="action-card-hint">Crea una sala y compártela con un código QR</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-join" onClick={() => navigate('/crossword/join')}>
          <span className="action-card-icon">📲</span>
          <span className="action-card-text">
            <span className="action-card-title">Unirse a una partida</span>
            <span className="action-card-hint">Escanea el QR o introduce el código de la sala</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-local" onClick={() => navigate('/crossword/local')}>
          <span className="action-card-icon">🎮</span>
          <span className="action-card-text">
            <span className="action-card-title">Jugar en este dispositivo</span>
            <span className="action-card-hint">Tú solo, sin necesidad de red</span>
          </span>
        </button>
      </div>
    </div>
  );
}
