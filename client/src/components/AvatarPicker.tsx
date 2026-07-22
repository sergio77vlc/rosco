import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_PLAYER_COLOR, PLAYER_AVATARS } from '@rosco/shared';
import AvatarView from './AvatarView';

interface AvatarPickerProps {
  value: string;
  onChange: (avatar: string) => void;
}

const CAPTURE_SIZE = 240;

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
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

  function chooseAvatar(a: string) {
    onChange(a);
    setPickerOpen(false);
  }

  return (
    <div className="avatar-picker">
      <AvatarView avatar={value} color={DEFAULT_PLAYER_COLOR} size={140} className="avatar-picker-preview" />

      <div className="avatar-picker-actions">
        <button type="button" className="btn btn-primary avatar-picker-camera-btn" onClick={openCamera}>
          📷 Hacer una foto
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setPickerOpen(true)}>
          🖼️ Elegir avatar
        </button>
      </div>

      {cameraError && <p className="error-text">{cameraError}</p>}

      {pickerOpen && (
        <div className="avatar-modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <h3>Elige tu avatar</h3>
              <button
                type="button"
                className="btn-icon-flat"
                onClick={() => setPickerOpen(false)}
                aria-label="Cerrar selector de avatar"
              >
                ✖️
              </button>
            </div>
            <div className="avatar-grid">
              {PLAYER_AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`avatar-option ${value === a ? 'avatar-option-active' : ''}`}
                  onClick={() => chooseAvatar(a)}
                  aria-label={`Elegir avatar ${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
