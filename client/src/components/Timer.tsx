import React, { useEffect, useState } from 'react';

interface TimerProps {
  endsAt: number | null;
  large?: boolean;
}

export default function Timer({ endsAt, large }: TimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => (endsAt ? endsAt - Date.now() : 0));

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt) return null;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const low = totalSeconds <= 15;

  return (
    <div className={`timer ${large ? 'timer-large' : ''} ${low ? 'timer-low' : ''}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
