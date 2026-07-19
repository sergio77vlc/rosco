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
  const { rosco, players, activePlayerIndex, phase, endsAt, submitAnswer, pass, resetGame } = useLocalGame();

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

  const activePlayer = players[activePlayerIndex];
  if (!activePlayer) return null;
  const publicActive = toPlayerPublic(activePlayer);

  return (
    <div className="local-game-wrap">
      <div className="turn-banner" key={`turn-${activePlayerIndex}`}>
        <span className="turn-banner-label">Turno de</span>
        <PlayerBadge name={activePlayer.name} color={activePlayer.color} />
      </div>

      <div className="scoreboard-row">
        {players.map((p, i) => {
          const pub = toPlayerPublic(p);
          const isActive = i === activePlayerIndex;
          const isFinished = Boolean(p.finishedAt);
          return (
            <div key={p.id} className={`scoreboard-chip ${isActive ? 'scoreboard-chip-active' : ''}`}>
              <PlayerBadge
                name={p.name}
                color={p.color}
                subtitle={
                  isFinished
                    ? `Terminado · ${pub.correctCount}✔ ${pub.wrongCount}✘`
                    : `${pub.correctCount}✔ ${pub.wrongCount}✘`
                }
              />
            </div>
          );
        })}
      </div>

      <RoscoPlayer
        key={`player-${activePlayerIndex}`}
        letters={rosco.letters}
        progress={publicActive.progress}
        currentIndex={activePlayer.currentIndex}
        finished={Boolean(activePlayer.finishedAt)}
        endsAt={endsAt}
        onSubmitAnswer={submitAnswer}
        onPass={pass}
      />
    </div>
  );
}
