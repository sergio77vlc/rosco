import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BattleHome() {
  const navigate = useNavigate();
  return (
    <div className="screen screen-center">
      <button className="back-to-hub-link" onClick={() => navigate('/')}>
        ← Todos los juegos
      </button>
      <h1 className="app-title">⚔️ Batalla</h1>
      <p className="app-subtitle">
        Crea tu personaje y responde preguntas de cultura general para atacar a tus rivales. ¡El
        último en pie gana!
      </p>
      <div className="home-actions">
        <button type="button" className="action-card action-card-host" onClick={() => navigate('/battle/host')}>
          <span className="action-card-icon">🎬</span>
          <span className="action-card-text">
            <span className="action-card-title">Hospedar partida</span>
            <span className="action-card-hint">Crea una sala y compártela con un código QR</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-join" onClick={() => navigate('/battle/join')}>
          <span className="action-card-icon">📲</span>
          <span className="action-card-text">
            <span className="action-card-title">Unirse a una partida</span>
            <span className="action-card-hint">Escanea el QR o introduce el código de la sala</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-local" onClick={() => navigate('/battle/local')}>
          <span className="action-card-icon">🎮</span>
          <span className="action-card-text">
            <span className="action-card-title">Jugar en este dispositivo</span>
            <span className="action-card-hint">Os turnáis en el mismo móvil, sin necesidad de red</span>
          </span>
        </button>
      </div>
    </div>
  );
}
