import React, { useEffect, useRef, useState } from 'react';
import { PLAYER_AVATARS } from '@rosco/shared';
import AvatarView from './AvatarView';

interface AvatarPickerProps {
  value: string;
  color: string;
  onChange: (avatar: string) => void;
}

const CAPTURE_SIZE = 240;

export default function AvatarPicker({ value, color, onChange }: AvatarPickerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function openCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError('No se pudo acceder a la cámara. Elige un avatar de la lista.');
    }
  }

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(CAPTURE_SIZE, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onChange(dataUrl);
    closeCamera();
  }

  return (
    <div className="avatar-picker">
      <AvatarView avatar={value} color={color} size={64} className="avatar-picker-preview" />
      <div className="avatar-grid">
        {PLAYER_AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={`avatar-option ${value === a ? 'avatar-option-active' : ''}`}
            onClick={() => onChange(a)}
            aria-label={`Elegir avatar ${a}`}
          >
            {a}
          </button>
        ))}
        <button
          type="button"
          className="avatar-option avatar-option-camera"
          onClick={openCamera}
          aria-label="Hacer una foto para el avatar"
          title="Hacer una foto"
        >
          📷
        </button>
      </div>
      {cameraError && <p className="error-text">{cameraError}</p>}

      {cameraOpen && (
        <div className="camera-modal-backdrop" onClick={closeCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-actions">
              <button type="button" className="btn btn-secondary" onClick={closeCamera}>
                ✖️ Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                📸 Capturar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
