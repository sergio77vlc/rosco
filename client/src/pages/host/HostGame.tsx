import React, { useEffect, useRef, useState } from 'react';
import type { RoomPublic } from '@rosco/shared';
import RoscoWheel from '../../components/RoscoWheel';
import Timer from '../../components/Timer';
import PlayerBadge from '../../components/PlayerBadge';
import Presenter, { type PresenterExpression } from '../../components/Presenter';
import { rankPlayers } from '../../utils/rank';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../../constants';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface HostGameProps {
  room: RoomPublic;
}

const EXPRESSION_HOLD_MS = 1800;

export default function HostGame({ room }: HostGameProps) {
  const ranking = rankPlayers(room.players);
  const rankByPlayerId = new Map(ranking.map((r) => [r.playerId, r.rank]));
  const themeInfo = categoryInfo(room.roscoTheme);
  const tts = useSpeechSynthesis();

  const [expression, setExpression] = useState<PresenterExpression>('neutral');
  const prevRoomRef = useRef<RoomPublic | null>(null);
  const expressionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashExpression(next: PresenterExpression) {
    setExpression(next);
    if (expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
    expressionTimeoutRef.current = setTimeout(() => setExpression('neutral'), EXPRESSION_HOLD_MS);
  }

  // Reacciona a lo que va pasando en la sala: sonríe con los aciertos, se entristece con los
  // fallos, y anuncia en voz alta (con los labios animados) cada cambio de turno.
  useEffect(() => {
    const prev = prevRoomRef.current;
    if (prev) {
      for (const player of room.players) {
        const prevPlayer = prev.players.find((p) => p.id === player.id);
        if (!prevPlayer) continue;
        for (let i = 0; i < player.progress.length; i++) {
          const before = prevPlayer.progress[i]?.state;
          const after = player.progress[i]?.state;
          if (before !== after && (after === 'correct' || after === 'wrong')) {
            flashExpression(after === 'correct' ? 'happy' : 'sad');
          }
        }
        if (!prevPlayer.finishedAt && player.finishedAt) {
          flashExpression('happy');
        }
      }
      if (prev.activePlayerId !== room.activePlayerId) {
        const active = room.players.find((p) => p.id === room.activePlayerId);
        if (active && tts.supported && tts.narrate) {
          tts.speak(`Turno de ${active.name}`, { interrupt: true });
        }
      }
    }
    prevRoomRef.current = room;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(
    () => () => {
      if (expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
    },
    [],
  );

  const activePlayer = room.players.find((p) => p.id === room.activePlayerId) ?? room.players[0];

  return (
    <div className="screen">
      <div className="host-game-header">
        <h1 className="screen-title">
          {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[room.roscoDifficulty]}{' '}
          {DIFFICULTY_LABELS[room.roscoDifficulty]}
        </h1>
        <div className="host-game-header-actions">
          {tts.supported && (
            <button
              type="button"
              className="btn-icon-flat"
              onClick={() => tts.setNarrate(!tts.narrate)}
              aria-label={tts.narrate ? 'Silenciar presentadora' : 'Activar voz de la presentadora'}
              title={tts.narrate ? 'Silenciar presentadora' : 'Activar voz de la presentadora'}
            >
              {tts.narrate ? '🔊' : '🔇'}
            </button>
          )}
          <Timer endsAt={room.endsAt} large />
        </div>
      </div>

      {activePlayer && (
        <div className="host-stage">
          <Presenter expression={expression} speaking={tts.speaking} size={170} className="host-presenter" />
          <div className="host-stage-wheel">
            <PlayerBadge
              name={activePlayer.name}
              color={activePlayer.color}
              avatar={activePlayer.avatar}
              connected={activePlayer.connected}
              subtitle={`#${rankByPlayerId.get(activePlayer.id)} · ${activePlayer.correctCount} aciertos · ${activePlayer.wrongCount} fallos`}
            />
            <RoscoWheel
              letters={activePlayer.rosco.letters}
              progress={activePlayer.progress}
              avatar={activePlayer.avatar}
              color={activePlayer.color}
              size={340}
            />
          </div>
        </div>
      )}

      <div className="host-wheel-grid-small">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`host-wheel-cell-small ${p.id === room.activePlayerId ? 'host-wheel-cell-active' : ''}`}
          >
            <div className="host-wheel-cell-small-header">
              <PlayerBadge name={p.name} color={p.color} avatar={p.avatar} connected={p.connected} size={22} />
              {p.finishedAt && <span className="badge-done badge-done-small">✓</span>}
            </div>
            <RoscoWheel letters={p.rosco.letters} progress={p.progress} avatar={p.avatar} color={p.color} size={110} />
          </div>
        ))}
      </div>
    </div>
  );
}
