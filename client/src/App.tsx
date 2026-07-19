import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LocalGameProvider } from './context/LocalGameContext';
import Home from './pages/Home';
import HostSetup from './pages/host/HostSetup';
import HostRoomPage from './pages/host/HostRoomPage';
import JoinScan from './pages/join/JoinScan';
import JoinLobby from './pages/join/JoinLobby';
import PlayerGame from './pages/join/PlayerGame';
import LocalSetup from './pages/local/LocalSetup';
import LocalGamePage from './pages/local/LocalGamePage';

export default function App() {
  return (
    <GameProvider>
      <LocalGameProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<HostSetup />} />
          <Route path="/host/:code" element={<HostRoomPage />} />
          <Route path="/join" element={<JoinScan />} />
          <Route path="/join/:code" element={<JoinLobby />} />
          <Route path="/play/:code" element={<PlayerGame />} />
          <Route path="/local" element={<LocalSetup />} />
          <Route path="/local/play" element={<LocalGamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LocalGameProvider>
    </GameProvider>
  );
}
