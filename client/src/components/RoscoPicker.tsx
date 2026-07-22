import React, { useState } from 'react';
import type { Difficulty, PackSummary, RoscoSelection } from '@rosco/shared';
import { DIFFICULTY_ICONS, DIFFICULTY_LABELS, categoryInfo } from '../constants';
import ContentPackPicker from './ContentPackPicker';

const ROSCO_THEME = 'cultura general';

interface RoscoPickerProps {
  value: RoscoSelection | null;
  onChange: (selection: RoscoSelection) => void;
}

export default function RoscoPicker({ value, onChange }: RoscoPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<PackSummary | null>(null);

  function choosePresetDifficulty(difficulty: Difficulty) {
    onChange({ mode: 'preset', theme: ROSCO_THEME, difficulty });
  }

  function choosePack(pack: PackSummary) {
    setSelectedPack(pack);
    onChange({ mode: 'pack', packId: pack.id });
  }

  const themeInfo = categoryInfo(ROSCO_THEME);

  return (
    <section className="setup-section">
      <h2>Rosco</h2>

      <div className="preset-picker">
        <h3 className="category-heading">
          {themeInfo.icon} {themeInfo.label}
        </h3>
        <p className="preset-picker-hint">Modo rápido: elige la dificultad, el rosco se asigna automáticamente.</p>
        <div className="pill-row">
          {(['medio', 'dificil'] as const).map((d) => (
            <button
              key={d}
              className={`pill ${value?.mode === 'preset' && value.difficulty === d ? 'pill-active' : ''}`}
              onClick={() => choosePresetDifficulty(d)}
            >
              {DIFFICULTY_ICONS[d]} {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="btn btn-secondary pack-picker-open-btn" onClick={() => setPickerOpen(true)}>
        📦 Elegir o crear un rosco guardado con IA
      </button>

      {value?.mode === 'preset' && (
        <p className="setup-selected">
          🎯 {themeInfo.icon} {themeInfo.label} · {DIFFICULTY_ICONS[value.difficulty]} {DIFFICULTY_LABELS[value.difficulty]}
        </p>
      )}
      {value?.mode === 'pack' && selectedPack && (
        <p className="setup-selected">
          🎯 Paquete seleccionado: <strong>{selectedPack.name}</strong> ({selectedPack.count} roscos)
        </p>
      )}

      <ContentPackPicker domain="rosco" open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={choosePack} />
    </section>
  );
}
