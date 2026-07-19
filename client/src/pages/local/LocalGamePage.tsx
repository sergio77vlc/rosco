import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerBadge from '../../components/PlayerBadge';
import RoscoPlayer from '../../components/RoscoPlayer';
import { useLocalGame } from '../../context/LocalGameContext';
import { rankPlayers } from '../../utils/rank';
import { toPlayerPublic } from '../../utils/localPlayer';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LocalGamePage() {
  const navigate = useNavigate();
  const { rosco, players, currentPlayerIndex, phase, currentEndsAt, beginCurrentTurn, submitAnswer, pass, resetGame } =
    useLocalGame();

  if (!rosco || players.length === 0) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">No hay ninguna partida local configurada.</p>
        <button className="btn btn-primary btn-big" onClick={() => navigate('/local')}>
          Configurar partida
        </button>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex];

  if (phase === 'handoff' && currentPlayer) {
    const isFirst = currentPlayerIndex === 0;
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">{isFirst ? '¡Vamos a jugar!' : 'Cambio de turno'}</h1>
        <p className="app-subtitle">Pasa el dispositivo a:</p>
        <div className="handoff-player">
          <PlayerBadge name={currentPlayer.name} color={currentPlayer.color} />
        </div>
        <p className="app-subtitle">
          Cuando {currentPlayer.name} esté listo/a, pulsa el botón para empezar su turno.
        </p>
        <button className="btn btn-primary btn-big" onClick={beginCurrentTurn}>
          Empezar turno de {currentPlayer.name}
        </button>
      </div>
    );
  }

  if (phase === 'results') {
    const ranking = rankPlayers(players.map(toPlayerPublic));
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">Resultados</h1>
        <h2 className="app-subtitle">{rosco.title}</h2>
        <div className="ranking-list">
          {ranking.map((r) => (
            <div key={r.playerId} className="ranking-row">
              <span className="ranking-medal">{MEDALS[r.rank - 1] ?? `#${r.rank}`}</span>
              <span className="ranking-name">{r.name}</span>
              <span className="ranking-score">
                {r.correctCount} aciertos · {r.wrongCount} fallos
              </span>
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary btn-big"
          onClick={() => {
            resetGame();
            navigate('/local');
          }}
        >
          Jugar otra vez
        </button>
      </div>
    );
  }

  if (!currentPlayer) return null;

  const publicPlayer = toPlayerPublic(currentPlayer);

  return (
    <RoscoPlayer
      letters={rosco.letters}
      progress={publicPlayer.progress}
      currentIndex={currentPlayer.currentIndex}
      finished={Boolean(currentPlayer.finishedAt)}
      endsAt={currentEndsAt}
      onSubmitAnswer={submitAnswer}
      onPass={pass}
      doneMessage={`¡${currentPlayer.name} ha terminado su rosco! Pasa el dispositivo al siguiente jugador.`}
    />
  );
}
