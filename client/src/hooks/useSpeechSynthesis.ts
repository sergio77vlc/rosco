import { useCallback, useEffect, useRef, useState } from 'react';

const RATE_STORAGE_KEY = 'rosco:tts-rate';
const AUTO_STORAGE_KEY = 'rosco:tts-auto';
const MIN_RATE = 0.5;
const MAX_RATE = 2;
const DEFAULT_RATE = 1;
const START_TIMEOUT_MS = 1500;

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

function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'es-es') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('es')) ||
    null
  );
}

export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [rate, setRateState] = useState<number>(readStoredRate);
  const [autoRead, setAutoReadState] = useState<boolean>(readStoredAutoRead);
  const [speaking, setSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [silentWarning, setSilentWarning] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voiceRef.current = pickSpanishVoice(voices);
        setVoicesReady(true);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const setRate = useCallback((value: number) => {
    const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, value));
    setRateState(clamped);
    window.localStorage.setItem(RATE_STORAGE_KEY, String(clamped));
  }, []);

  const setAutoRead = useCallback((value: boolean) => {
    setAutoReadState(value);
    window.localStorage.setItem(AUTO_STORAGE_KEY, value ? '1' : '0');
  }, []);

  const clearStartTimeout = useCallback(() => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      primedRef.current = true;
      setSilentWarning(false);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = rate;
      utterance.onstart = () => {
        clearStartTimeout();
        setSpeaking(true);
      };
      utterance.onend = () => {
        clearStartTimeout();
        setSpeaking(false);
      };
      utterance.onerror = () => {
        clearStartTimeout();
        setSpeaking(false);
        setSilentWarning(true);
      };
      clearStartTimeout();
      startTimeoutRef.current = setTimeout(() => {
        // Si tras un tiempo prudencial no ha empezado ni ha lanzado error, es que
        // el navegador está bloqueando el audio en silencio (sin voces, Shields, etc).
        setSilentWarning(true);
      }, START_TIMEOUT_MS);
      window.speechSynthesis.speak(utterance);
    },
    [supported, rate, clearStartTimeout],
  );

  const stop = useCallback(() => {
    clearStartTimeout();
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported, clearStartTimeout]);

  /** Debe llamarse dentro de un gesto de usuario real (click) para desbloquear el audio en navegadores que bloquean voz sintetizada disparada automáticamente. */
  const prime = useCallback(() => {
    if (!supported || primedRef.current) return;
    primedRef.current = true;
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    return () => {
      clearStartTimeout();
      window.speechSynthesis.cancel();
    };
  }, [supported, clearStartTimeout]);

  return {
    supported,
    voicesReady,
    silentWarning,
    rate,
    setRate,
    autoRead,
    setAutoRead,
    speaking,
    speak,
    stop,
    prime,
    MIN_RATE,
    MAX_RATE,
  };
}
