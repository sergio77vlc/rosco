import React, { useEffect, useState } from 'react';
import type { Difficulty, PackDomain, PackSummary } from '@rosco/shared';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS } from '../constants';

interface ContentPackPickerProps {
  domain: PackDomain;
  open: boolean;
  onClose: () => void;
  onSelect: (pack: PackSummary) => void;
}

const DOMAIN_COPY: Record<PackDomain, { title: string; noun: string; nounPlural: string; themeHint: string }> = {
  rosco: {
    title: 'Roscos guardados',
    noun: 'rosco',
    nounPlural: 'roscos',
    themeHint: 'Ej: Star Wars, la Antigua Roma, videojuegos...',
  },
  quiz: {
    title: 'Paquetes de preguntas',
    noun: 'pregunta',
    nounPlural: 'preguntas',
    themeHint: 'Ej: historia de España, ciencia, deportes...',
  },
  battle: {
    title: 'Paquetes de preguntas',
    noun: 'pregunta',
    nounPlural: 'preguntas',
    themeHint: 'Ej: cine de acción, mitología, geografía...',
  },
};

export default function ContentPackPicker({ domain, open, onClose, onSelect }: ContentPackPickerProps) {
  const copy = DOMAIN_COPY[domain];

  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'todas'>('todas');

  const [genTheme, setGenTheme] = useState('');
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('medio');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/packs/${domain}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los paquetes.');
        if (!cancelled) setPacks(data.packs);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Error cargando paquetes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, domain]);

  if (!open) return null;

  async function handleGenerate() {
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/packs/${domain}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: genTheme, difficulty: genDifficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el paquete.');
      setPacks((prev) => [data.pack, ...prev]);
      setGenTheme('');
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Error generando el paquete.');
    } finally {
      setGenLoading(false);
    }
  }

  function choose(pack: PackSummary) {
    onSelect(pack);
    onClose();
  }

  const filtered = packs.filter((p) => {
    if (difficultyFilter !== 'todas' && p.difficulty !== difficultyFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="avatar-modal-backdrop" onClick={onClose}>
      <div className="avatar-modal pack-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-modal-header">
          <h3>📦 {copy.title}</h3>
          <button type="button" className="btn-icon-flat" onClick={onClose} aria-label="Cerrar selector de paquetes">
            ✖️
          </button>
        </div>

        <input
          type="text"
          className="pack-search-input"
          placeholder={`Buscar ${copy.nounPlural}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="pill-row">
          <button
            className={`pill ${difficultyFilter === 'todas' ? 'pill-active' : ''}`}
            onClick={() => setDifficultyFilter('todas')}
          >
            Todas
          </button>
          {(['medio', 'dificil'] as const).map((d) => (
            <button
              key={d}
              className={`pill ${difficultyFilter === d ? 'pill-active' : ''}`}
              onClick={() => setDifficultyFilter(d)}
            >
              {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        <div className="pack-list">
          {loading && <p className="pack-hint">Cargando paquetes...</p>}
          {loadError && <p className="error-text">{loadError}</p>}
          {!loading && !loadError && filtered.length === 0 && (
            <p className="pack-hint">No hay paquetes guardados todavía. ¡Crea el primero abajo!</p>
          )}
          {filtered.map((pack) => (
            <div key={pack.id} className="pack-item">
              <div className="pack-item-info">
                <strong>{pack.name}</strong>
                <span className="pack-item-meta">
                  {DIFFICULTY_ICONS[pack.difficulty]} {DIFFICULTY_LABELS[pack.difficulty]} · {pack.count}{' '}
                  {copy.nounPlural}
                </span>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => choose(pack)}>
                Usar
              </button>
            </div>
          ))}
        </div>

        <div className="pack-generate">
          <h4>✨ Crear uno nuevo con IA</h4>
          <input
            type="text"
            placeholder={copy.themeHint}
            value={genTheme}
            onChange={(e) => setGenTheme(e.target.value)}
            maxLength={120}
          />
          <div className="pill-row">
            {(['medio', 'dificil'] as const).map((d) => (
              <button
                key={d}
                className={`pill ${genDifficulty === d ? 'pill-active' : ''}`}
                onClick={() => setGenDifficulty(d)}
              >
                {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={genLoading || !genTheme.trim()}
          >
            {genLoading ? '✨ Generando...' : '✨ Generar y guardar'}
          </button>
          {genError && <p className="error-text">{genError}</p>}
        </div>
      </div>
    </div>
  );
}
