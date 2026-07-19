import { useCallback, useEffect, useState } from 'react';

const RATE_STORAGE_KEY = 'rosco:tts-rate';
const AUTO_STORAGE_KEY = 'rosco:tts-auto';
const MIN_RATE = 0.5;
const MAX_RATE = 2;
const DEFAULT_RATE = 1;

function readStoredRate(): number {
  if (typeof window === 'undefined') return DEFAULT_RATE;
  const stored = Number(window.localStorage.getItem(RATE_STORAGE_KEY));
  return stored >= MIN_RATE && stored <= MAX_RATE ? stored : DEFAULT_RATE;
}

function readStoredAutoRead(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(AUTO_STORAGE_KEY);
  return stored === null ? true : stored === '1';
}

export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [rate, setRateState] = useState<number>(readStoredRate);
  const [autoRead, setAutoReadState] = useState<boolean>(readStoredAutoRead);
  const [speaking, setSpeaking] = useState(false);

  const setRate = useCallback((value: number) => {
    const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, value));
    setRateState(clamped);
    window.localStorage.setItem(RATE_STORAGE_KEY, String(clamped));
  }, []);

  const setAutoRead = useCallback((value: boolean) => {
    setAutoReadState(value);
    window.localStorage.setItem(AUTO_STORAGE_KEY, value ? '1' : '0');
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = rate;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported, rate],
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  return { supported, rate, setRate, autoRead, setAutoRead, speaking, speak, stop, MIN_RATE, MAX_RATE };
}
