import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PasapalabraHome() {
  const navigate = useNavigate();
  return (
    <div className="screen screen-center">
      <button className="back-to-hub-link" onClick={() => navigate('/')}>
        ← Todos los juegos
      </button>
      <h1 className="app-title">🎯 Pasapalabra</h1>
      <p className="app-subtitle">El clásico juego de Pasapalabra, con tus amigos y sus móviles.</p>
      <div className="home-actions">
        <button className="btn btn-primary btn-big" onClick={() => navigate('/host')}>
          Hospedar partida
        </button>
        <button className="btn btn-secondary btn-big" onClick={() => navigate('/join')}>
          Unirse a una partida
        </button>
        <button className="btn btn-tertiary btn-big" onClick={() => navigate('/local')}>
          Jugar en este dispositivo
        </button>
      </div>
    </div>
  );
}
