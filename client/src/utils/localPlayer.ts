import type { LetterState, PlayerProgressEntry, PlayerPublic } from '@rosco/shared';
import type { LocalPlayerState } from '../context/LocalGameContext';

function withActiveState(progress: LetterState[], currentIndex: number, finished: boolean): PlayerProgressEntry[] {
  return progress.map((state, idx): PlayerProgressEntry => {
    if (!finished && idx === currentIndex && (state === 'pending' || state === 'passed')) {
      return { state: 'active' };
    }
    return { state };
  });
}

export function toPlayerPublic(player: LocalPlayerState): PlayerPublic {
  const finished = Boolean(player.finishedAt);
  const correctCount = player.progress.filter((s) => s === 'correct').length;
  const wrongCount = player.progress.filter((s) => s === 'wrong').length;
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    connected: true,
    progress: withActiveState(player.progress, player.currentIndex, finished),
    currentIndex: player.currentIndex,
    correctCount,
    wrongCount,
    finishedAt: player.finishedAt,
  };
}
