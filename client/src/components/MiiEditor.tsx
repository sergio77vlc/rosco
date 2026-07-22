import React, { useEffect, useRef, useState } from 'react';
import {
  MII_EXPRESSIONS,
  MII_HAIR_COLORS,
  MII_HAIR_STYLES,
  MII_OUTFIT_COLORS,
  MII_OUTFIT_STYLES,
  MII_PANTS_COLORS,
  MII_SKIN_TONES,
  type MiiConfig,
  type MiiExpression,
} from '@rosco/shared';
import MiiAvatar from './MiiAvatar';

interface MiiEditorProps {
  value: MiiConfig;
  onChange: (mii: MiiConfig) => void;
}

const CAPTURE_SIZE = 240;

export default function MiiEditor({ value, onChange }: MiiEditorProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewExpression, setPreviewExpression] = useState<MiiExpression>('neutral');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function patch(p: Partial<MiiConfig>) {
    onChange({ ...value, ...p });
  }

  async function openCamera() {
    setCameraError(null);
    setVideoReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError('No se pudo acceder a la cámara.');
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
    setVideoReady(false);
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
    patch({ photo: canvas.toDataURL('image/jpeg', 0.85) });
    closeCamera();
  }

  return (
    <div className="mii-picker">
      <MiiAvatar mii={value} size={140} className="mii-picker-preview" />
      <button type="button" className="btn btn-primary mii-picker-open-btn" onClick={() => setEditorOpen(true)}>
        🎨 Personalizar personaje
      </button>

      {editorOpen && (
        <div className="avatar-modal-backdrop" onClick={() => setEditorOpen(false)}>
          <div className="avatar-modal mii-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <h3>Personaliza tu personaje</h3>
              <button
                type="button"
                className="btn-icon-flat"
                onClick={() => setEditorOpen(false)}
                aria-label="Cerrar editor de personaje"
              >
                ✖️
              </button>
            </div>

            <MiiAvatar mii={value} expression={previewExpression} size={130} className="mii-editor-preview" />

            <div className="mii-editor-section">
              <span className="mii-editor-label">Expresión (vista previa)</span>
              <p className="mii-editor-hint">No se guarda: se usará automáticamente durante la partida.</p>
              <div className="mii-editor-options">
                {MII_EXPRESSIONS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`avatar-option ${previewExpression === e.id ? 'avatar-option-active' : ''}`}
                    onClick={() => setPreviewExpression(e.id)}
                    aria-label={e.label}
                    title={e.label}
                  >
                    {e.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mii-editor-section">
              <span className="mii-editor-label">Cara</span>
              <div className="mii-editor-face-actions">
                <button type="button" className="btn btn-secondary" onClick={openCamera}>
                  📷 {value.photo ? 'Cambiar foto' : 'Hacer una foto'}
                </button>
                {value.photo && (
                  <button type="button" className="btn btn-tertiary" onClick={() => patch({ photo: null })}>
                    ✖️ Quitar foto
                  </button>
                )}
              </div>
              {cameraError && <p className="error-text">{cameraError}</p>}
              {!value.photo && (
                <div className="mii-editor-swatches">
                  {MII_SKIN_TONES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`mii-swatch ${value.skinTone === c ? 'mii-swatch-active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => patch({ skinTone: c })}
                      aria-label={`Tono de piel ${c}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mii-editor-section">
              <span className="mii-editor-label">Pelo</span>
              <div className="mii-editor-options">
                {MII_HAIR_STYLES.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`avatar-option ${value.hairStyle === h.id ? 'avatar-option-active' : ''}`}
                    onClick={() => patch({ hairStyle: h.id })}
                    aria-label={h.label}
                    title={h.label}
                  >
                    {h.icon}
                  </button>
                ))}
              </div>
              <div className="mii-editor-swatches">
                {MII_HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`mii-swatch ${value.hairColor === c ? 'mii-swatch-active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => patch({ hairColor: c })}
                    aria-label={`Color de pelo ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="mii-editor-section">
              <span className="mii-editor-label">Ropa</span>
              <div className="mii-editor-options">
                {MII_OUTFIT_STYLES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`avatar-option ${value.outfitStyle === o.id ? 'avatar-option-active' : ''}`}
                    onClick={() => patch({ outfitStyle: o.id })}
                    aria-label={o.label}
                    title={o.label}
                  >
                    {o.icon}
                  </button>
                ))}
              </div>
              <div className="mii-editor-swatches">
                {MII_OUTFIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`mii-swatch ${value.outfitColor === c ? 'mii-swatch-active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => patch({ outfitColor: c })}
                    aria-label={`Color de ropa ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="mii-editor-section">
              <span className="mii-editor-label">Pantalón</span>
              <div className="mii-editor-swatches">
                {MII_PANTS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`mii-swatch ${value.pantsColor === c ? 'mii-swatch-active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => patch({ pantsColor: c })}
                    aria-label={`Color de pantalón ${c}`}
                  />
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-big" onClick={() => setEditorOpen(false)}>
              ✅ Listo
            </button>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="camera-modal-backdrop" onClick={closeCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              onLoadedMetadata={() => setVideoReady(true)}
            />
            <div className="camera-actions">
              <button type="button" className="btn btn-secondary" onClick={closeCamera}>
                ✖️ Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={capturePhoto} disabled={!videoReady}>
                {videoReady ? '📸 Capturar' : 'Encendiendo cámara...'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
