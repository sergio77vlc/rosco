import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePackContentCount } from '../hooks/usePackContentCount';

export default function PasapalabraHome() {
  const navigate = useNavigate();
  const { itemCount, packCount } = usePackContentCount('rosco');
  return (
    <div className="screen screen-center">
      <button className="back-to-hub-link" onClick={() => navigate('/')}>
        ← Todos los juegos
      </button>
      <h1 className="app-title">🎯 Pasapalabra</h1>
      <p className="app-subtitle">El clásico juego de Pasapalabra, con tus amigos y sus móviles.</p>
      {packCount > 0 && (
        <p className="home-content-count">
          📦 {itemCount} roscos guardados en {packCount} {packCount === 1 ? 'paquete' : 'paquetes'} creados con IA
        </p>
      )}
      <div className="home-actions">
        <button type="button" className="action-card action-card-host" onClick={() => navigate('/host')}>
          <span className="action-card-icon">🎬</span>
          <span className="action-card-text">
            <span className="action-card-title">Hospedar partida</span>
            <span className="action-card-hint">Crea una sala y compártela con un código QR</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-join" onClick={() => navigate('/join')}>
          <span className="action-card-icon">📲</span>
          <span className="action-card-text">
            <span className="action-card-title">Unirse a una partida</span>
            <span className="action-card-hint">Escanea el QR o introduce el código de la sala</span>
          </span>
        </button>
        <button type="button" className="action-card action-card-local" onClick={() => navigate('/local')}>
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
