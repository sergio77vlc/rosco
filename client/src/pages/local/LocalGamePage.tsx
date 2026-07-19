import React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarView from '../../components/AvatarView';
import RoscoPlayer from '../../components/RoscoPlayer';
import { useLocalGame } from '../../context/LocalGameContext';
import { rankPlayers } from '../../utils/rank';
import { toPlayerPublic } from '../../utils/localPlayer';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../../constants';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LocalGamePage() {
  const navigate = useNavigate();
  const {
    roscoTheme,
    roscoDifficulty,
    players,
    activePlayerIndex,
    phase,
    endsAt,
    lastEvent,
    submitAnswer,
    pass,
    resetGame,
  } = useLocalGame();

  if (!roscoDifficulty || players.length === 0) {
    return (
      <div className="screen screen-center">
        <p className="app-subtitle">No hay ninguna partida local configurada.</p>
        <button className="btn btn-primary btn-big" onClick={() => navigate('/local')}>
          Configurar partida
        </button>
      </div>
    );
  }

  const themeInfo = categoryInfo(roscoTheme);

  if (phase === 'results') {
    const ranking = rankPlayers(players.map(toPlayerPublic));
    return (
      <div className="screen screen-center">
        <h1 className="screen-title">Resultados</h1>
        <h2 className="app-subtitle">
          {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[roscoDifficulty]} {DIFFICULTY_LABELS[roscoDifficulty]}
        </h2>
        <div className="ranking-list">
          {ranking.map((r) => (
            <div key={r.playerId} className="ranking-row">
              <span className="ranking-medal">{MEDALS[r.rank - 1] ?? `#${r.rank}`}</span>
              <AvatarView avatar={r.avatar} color={r.color} size={32} />
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
          🔁 Jugar otra vez
        </button>
      </div>
    );
  }

  const activePlayer = players[activePlayerIndex];
  if (!activePlayer) return null;
  const publicActive = toPlayerPublic(activePlayer);

  const otherPlayers = players.filter((_, i) => i !== activePlayerIndex);

  return (
    <RoscoPlayer
      key={`player-${activePlayerIndex}`}
      letters={activePlayer.rosco.letters}
      progress={publicActive.progress}
      currentIndex={activePlayer.currentIndex}
      finished={Boolean(activePlayer.finishedAt)}
      endsAt={endsAt}
      onSubmitAnswer={submitAnswer}
      onPass={pass}
      playerName={activePlayer.name}
      playerAvatar={activePlayer.avatar}
      playerColor={activePlayer.color}
      correctCount={publicActive.correctCount}
      wrongCount={publicActive.wrongCount}
      activePlayerName={activePlayer.name}
      outcomeEvent={lastEvent}
      turnLabel="Turno de"
      doneMessage={`¡${activePlayer.name} ha terminado su rosco!`}
      headerExtra={
        otherPlayers.length > 0 ? (
          <div className="mini-scoreboard">
            {otherPlayers.map((p) => {
              const pub = toPlayerPublic(p);
              return (
                <div
                  key={p.id}
                  className={`mini-scoreboard-chip ${p.finishedAt ? 'mini-scoreboard-chip-done' : ''}`}
                  title={`${p.name}: ${pub.correctCount} aciertos, ${pub.wrongCount} fallos`}
                >
                  <AvatarView avatar={p.avatar} color={p.color} size={24} />
                  <span>
                    {pub.correctCount}✔ {pub.wrongCount}✘
                  </span>
                </div>
              );
            })}
          </div>
        ) : null
      }
    />
  );
}
