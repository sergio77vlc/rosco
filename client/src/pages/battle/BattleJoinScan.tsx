import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SCANNER_ELEMENT_ID = 'battle-qr-scanner-region';

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

export default function BattleJoinScan() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  async function startScanning() {
    setScanError(null);
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
          navigate(`/battle/join/${code.toUpperCase()}`);
        },
        () => {
          /* ignore per-frame scan failures */
        },
      );
      setScanning(true);
    } catch {
      setScanError('No se pudo acceder a la cámara. Introduce el código manualmente.');
      setScanning(false);
    }
  }

  useEffect(() => {
    startScanning();
    return () => {
      scannerRef.current?.stop?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (code) navigate(`/battle/join/${code}`);
  }

  return (
    <div className="screen screen-center">
      <h1 className="screen-title">Unirse a una batalla</h1>
      <p className="app-subtitle">Apunta la cámara al código QR de la sala.</p>

      <div className="scanner-wrap">
        <div id={SCANNER_ELEMENT_ID} className="scanner-square" />
        {!scanning && !scanError && <p className="app-subtitle">Activando la cámara...</p>}
        {scanError && (
          <>
            <p className="error-text">{scanError}</p>
            <button className="btn btn-secondary" onClick={startScanning}>
              Reintentar
            </button>
          </>
        )}
      </div>

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
