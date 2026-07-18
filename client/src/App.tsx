import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import HostSetup from './pages/host/HostSetup';
import HostRoomPage from './pages/host/HostRoomPage';
import JoinScan from './pages/join/JoinScan';
import JoinLobby from './pages/join/JoinLobby';
import PlayerGame from './pages/join/PlayerGame';

export default function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<HostSetup />} />
        <Route path="/host/:code" element={<HostRoomPage />} />
        <Route path="/join" element={<JoinScan />} />
        <Route path="/join/:code" element={<JoinLobby />} />
        <Route path="/play/:code" element={<PlayerGame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}
