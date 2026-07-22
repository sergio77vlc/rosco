import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LocalGameProvider } from './context/LocalGameContext';
import { QuizProvider } from './context/QuizContext';
import { BattleProvider } from './context/BattleContext';
import { LocalBattleProvider } from './context/BattleLocalContext';
import GamesHub from './pages/GamesHub';
import PasapalabraHome from './pages/PasapalabraHome';
import HostSetup from './pages/host/HostSetup';
import HostRoomPage from './pages/host/HostRoomPage';
import JoinScan from './pages/join/JoinScan';
import JoinLobby from './pages/join/JoinLobby';
import PlayerGame from './pages/join/PlayerGame';
import LocalSetup from './pages/local/LocalSetup';
import LocalGamePage from './pages/local/LocalGamePage';
import QuizHome from './pages/quiz/QuizHome';
import QuizHostSetup from './pages/quiz/QuizHostSetup';
import QuizHostRoomPage from './pages/quiz/QuizHostRoomPage';
import QuizJoinScan from './pages/quiz/QuizJoinScan';
import QuizJoinLobby from './pages/quiz/QuizJoinLobby';
import QuizPlayerGame from './pages/quiz/QuizPlayerGame';
import BattleHome from './pages/battle/BattleHome';
import BattleHostSetup from './pages/battle/BattleHostSetup';
import BattleHostRoomPage from './pages/battle/BattleHostRoomPage';
import BattleJoinScan from './pages/battle/BattleJoinScan';
import BattleJoinLobby from './pages/battle/BattleJoinLobby';
import BattlePlayerGame from './pages/battle/BattlePlayerGame';
import BattleLocalSetup from './pages/battle/BattleLocalSetup';
import BattleLocalGamePage from './pages/battle/BattleLocalGamePage';

export default function App() {
  return (
    <GameProvider>
      <LocalGameProvider>
        <QuizProvider>
          <BattleProvider>
            <LocalBattleProvider>
              <Routes>
                <Route path="/" element={<GamesHub />} />
                <Route path="/pasapalabra" element={<PasapalabraHome />} />
                <Route path="/host" element={<HostSetup />} />
                <Route path="/host/:code" element={<HostRoomPage />} />
                <Route path="/join" element={<JoinScan />} />
                <Route path="/join/:code" element={<JoinLobby />} />
                <Route path="/play/:code" element={<PlayerGame />} />
                <Route path="/local" element={<LocalSetup />} />
                <Route path="/local/play" element={<LocalGamePage />} />
                <Route path="/quiz" element={<QuizHome />} />
                <Route path="/quiz/host" element={<QuizHostSetup />} />
                <Route path="/quiz/host/:code" element={<QuizHostRoomPage />} />
                <Route path="/quiz/join" element={<QuizJoinScan />} />
                <Route path="/quiz/join/:code" element={<QuizJoinLobby />} />
                <Route path="/quiz/play/:code" element={<QuizPlayerGame />} />
                <Route path="/battle" element={<BattleHome />} />
                <Route path="/battle/host" element={<BattleHostSetup />} />
                <Route path="/battle/host/:code" element={<BattleHostRoomPage />} />
                <Route path="/battle/join" element={<BattleJoinScan />} />
                <Route path="/battle/join/:code" element={<BattleJoinLobby />} />
                <Route path="/battle/play/:code" element={<BattlePlayerGame />} />
                <Route path="/battle/local" element={<BattleLocalSetup />} />
                <Route path="/battle/local/play" element={<BattleLocalGamePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </LocalBattleProvider>
          </BattleProvider>
        </QuizProvider>
      </LocalGameProvider>
    </GameProvider>
  );
}
