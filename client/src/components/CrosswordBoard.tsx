import React, { useEffect, useRef, useState } from 'react';
import type { CrosswordRoomPublic } from '@rosco/shared';
import CrosswordGrid from './CrosswordGrid';
import CrosswordCluePanel from './CrosswordCluePanel';
import AvatarView from './AvatarView';
import { pickClueOnCellClick } from '../utils/crosswordGrid';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { pickSolvedLine } from '../utils/crosswordNarration';

// El color de perfil (`player.color`) es siempre 'transparent' (los avatares ya no llevan
// color de fondo), así que para distinguir a cada jugador en el resaltado de presencia se usa
// una paleta propia, asignada por orden de entrada a la sala.
const PLAYER_FOCUS_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899', '#06b6d4'];

interface CrosswordBoardProps {
  room: CrosswordRoomPublic;
  myPlayerId?: string | null;
  onFocus?: (clueId: string | null) => void;
  onSubmit?: (clueId: string, answerText: string) => Promise<boolean>;
}

/** Tablero compartido: la misma rejilla en tiempo real, en el dashboard del anfitrión y en el
 * móvil de cada jugador. Sin turnos: cualquiera puede seleccionar y resolver cualquier palabra. */
export default function CrosswordBoard({ room, myPlayerId, onFocus, onSubmit }: CrosswordBoardProps) {
  const tts = useSpeechSynthesis();
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const lastAnnouncedAt = useRef<number | null>(null);

  function selectClue(clueId: string | null) {
    setSelectedClueId(clueId);
    onFocus?.(clueId);
  }

  function handleSelectCell(row: number, col: number) {
    const next = pickClueOnCellClick(room.clues, row, col, selectedClueId);
    if (next) selectClue(next);
  }

  useEffect(() => {
    if (!room.lastSolved || lastAnnouncedAt.current === room.lastSolved.at) return;
    lastAnnouncedAt.current = room.lastSolved.at;
    const line = pickSolvedLine(room.lastSolved.playerName, room.lastSolved.word, room.lastSolved.points);
    if (tts.supported && tts.narrate) tts.speak(line, { interrupt: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.lastSolved?.at]);

  const playerColor = (playerId: string) => {
    const index = room.players.findIndex((p) => p.id === playerId);
    return PLAYER_FOCUS_COLORS[index % PLAYER_FOCUS_COLORS.length];
  };

  const focusHighlights = room.players
    .filter((p) => p.id !== myPlayerId && p.focusedClueId)
    .map((p) => ({ clueId: p.focusedClueId as string, color: playerColor(p.id) }));

  return (
    <div className="crossword-board">
      <div className="crossword-scoreboard">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`crossword-score-chip ${p.id === myPlayerId ? 'crossword-score-chip-me' : ''}`}
            style={{ borderColor: playerColor(p.id) }}
          >
            <AvatarView avatar={p.avatar} color={p.color} size={28} />
            <span className="crossword-score-chip-name">{p.name}</span>
            <span className="crossword-score-chip-score">{p.score}</span>
          </div>
        ))}
      </div>

      <CrosswordGrid
        grid={room.grid}
        clues={room.clues}
        selectedClueId={selectedClueId}
        focusHighlights={focusHighlights}
        onSelectCell={handleSelectCell}
      />

      <CrosswordCluePanel clues={room.clues} selectedClueId={selectedClueId} onSelectClue={selectClue} onSubmit={onSubmit} />
    </div>
  );
}
