import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SCANNER_ELEMENT_ID = 'quiz-qr-scanner-region';

function extractRoomCode(decoded: string): string {
  try {
    const url = new URL(decoded);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('join');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // No es una URL, puede que sea el código directamente.
  }
  return decoded.trim();
}

export default function QuizJoinScan() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop?.().catch(() => {});
    };
  }, []);

  async function startScanning() {
    setScanError(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        async (decodedText: string) => {
          const code = extractRoomCode(decodedText);
          await scanner.stop().catch(() => {});
          setScanning(false);
          navigate(`/quiz/join/${code.toUpperCase()}`);
        },
        () => {
          /* ignore per-frame scan failures */
        },
      );
    } catch (err) {
      setScanError('No se pudo acceder a la cámara. Usa el código manual.');
      setScanning(false);
    }
  }

  async function stopScanning() {
    await scannerRef.current?.stop?.().catch(() => {});
    setScanning(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (code) navigate(`/quiz/join/${code}`);
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Unirse a un quiz</h1>

      {!scanning && (
        <button className="btn btn-primary btn-big" onClick={startScanning}>
          Escanear código QR
        </button>
      )}

      {scanning && (
        <div className="scanner-wrap">
          <div id={SCANNER_ELEMENT_ID} />
          <button className="btn btn-secondary" onClick={stopScanning}>
            Cancelar
          </button>
        </div>
      )}

      {scanError && <p className="error-text">{scanError}</p>}

      <div className="divider">o</div>

      <form className="manual-code-form" onSubmit={handleManualSubmit}>
        <input
          type="text"
          placeholder="Código de sala"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <button className="btn btn-secondary" type="submit" disabled={!manualCode.trim()}>
          Entrar
        </button>
      </form>
    </div>
  );
}
