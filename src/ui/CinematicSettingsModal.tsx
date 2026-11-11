import React, { useEffect } from 'react';
import { useWorldStore, CinematicPreset } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

const PRESET_CARDS: Array<{
  id: CinematicPreset;
  title: string;
  badge: string;
  desc: string;
  icon: string;
  color: string;
}> = [
  {
    id: 'cinematic',
    title: 'Cinématique',
    badge: 'Recommandé Hackathon',
    desc: 'Colorimétrie chaude, léger bloom et vignettage réglable pour une présentation stylisée.',
    icon: '🌟',
    color: '#10b981'
  },
  {
    id: 'golden_hour',
    title: 'Golden Hour Sunset',
    badge: 'Ambiance Chaude',
    desc: 'Bain de lumière ambrée, reflets dorés enrichis et diffusion atmosphérique de fin de journée.',
    icon: '🌅',
    color: '#f59e0b'
  },
  {
    id: 'cyberpunk_neon',
    title: 'Cyberpunk Néon',
    badge: 'Contraste Électrique',
    desc: 'Scission chromatique cyan/magenta, lueurs néon saturées et noirs profonds stylisés.',
    icon: '⚡',
    color: '#ec4899'
  },
  {
    id: 'studio_neutral',
    title: 'Studio Neutre',
    badge: 'Haute Fidélité',
    desc: 'Rendu clinique de précision, blancs neutres équilibrés et netteté maximale des textures.',
    icon: '📷',
    color: '#38bdf8'
  },
  {
    id: 'standard',
    title: 'Standard WebGL (Bypass)',
    badge: 'Mode Brut',
    desc: 'Rendu direct sans post-traitement optique pour constater le bond qualitatif en direct.',
    icon: '🖥️',
    color: '#94a3b8'
  }
];

export const CinematicSettingsModal: React.FC = () => {
  const show = useWorldStore(state => state.showCinematicModal);
  const close = () => useWorldStore.getState().setShowCinematicModal(false);
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const cinematicPreset = useWorldStore(state => state.cinematicPreset);
  const setCinematicPreset = useWorldStore(state => state.setCinematicPreset);
  const bloomIntensity = useWorldStore(state => state.bloomIntensity);
  const setBloomIntensity = useWorldStore(state => state.setBloomIntensity);
  const vignetteStrength = useWorldStore(state => state.vignetteStrength);
  const setVignetteStrength = useWorldStore(state => state.setVignetteStrength);
  const chromaticAberration = useWorldStore(state => state.chromaticAberration);
  const setChromaticAberration = useWorldStore(state => state.setChromaticAberration);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (show) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  if (!show) return null;

  const handleSelectPreset = (preset: CinematicPreset) => {
    setCinematicPreset(preset);
    playAudioFx('switch_click');
  };

  const handleToggleBeforeAfter = () => {
    if (cinematicPreset === 'standard') {
      setCinematicPreset('cinematic');
      playAudioFx('fanfare');
    } else {
      setCinematicPreset('standard');
      playAudioFx('switch_click');
    }
  };

  const getPresetCardInfo = (preset: typeof PRESET_CARDS[0]) => {
    if (isFr) return preset;
    switch (preset.id) {
      case 'cinematic':
        return {
          ...preset,
          title: 'Cinematic',
          badge: 'Hackathon Pick',
          desc: 'Warm color grading, soft bloom, and adjustable vignetting for a stylized look.'
        };
      case 'golden_hour':
        return {
          ...preset,
          title: 'Golden Hour Sunset',
          badge: 'Warm Atmosphere',
          desc: 'Warm amber light, rich golden specular reflections, and dusk diffusion.'
        };
      case 'cyberpunk_neon':
        return {
          ...preset,
          title: 'Cyberpunk Neon',
          badge: 'Electric Contrast',
          desc: 'Cyan/magenta chromatic splits, saturated neon glows, and stylized deep blacks.'
        };
      case 'studio_neutral':
        return {
          ...preset,
          title: 'Neutral Studio',
          badge: 'High Fidelity',
          desc: 'Clean clinical precision, balanced neutral whites, and maximum texture clarity.'
        };
      case 'standard':
        return {
          ...preset,
          title: 'Standard WebGL (Bypass)',
          badge: 'Raw Mode',
          desc: 'Direct rendering without optical post-processing to verify the raw quality baseline.'
        };
      default:
        return preset;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cinematic-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(12px)',
        padding: '20px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1.5px solid rgba(16, 185, 129, 0.45)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.2)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '22px',
              background: 'linear-gradient(135deg, #10b981, #38bdf8)',
              padding: '6px 10px',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}>
              🌟
            </span>
            <div>
              <h2 id="cinematic-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                {isFr ? 'Étalonnage et effets optiques de la scène' : 'Scene Color Grading & Optical Post-Processing'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isFr ? 'Ces effets modifient l’image finale ; ils ne remplacent pas les modèles, matériaux ni l’éclairage de la scène.' : 'These effects modify final compositing; they do not replace geometry models, materials or scene lighting.'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label={isFr ? "Fermer" : "Close"}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Toggle Compare Banner */}
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>
                {isFr ? 'Comparateur Instantané « Avant / Après »' : 'Instant "Before / After" Comparator'}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                {isFr ? 'Passez en un clic du WebGL standard au rendu cinématographique photoréaliste' : 'Switch in one click between raw standard WebGL and photorealistic cinematic pipeline'}
              </div>
            </div>
            <button
              onClick={handleToggleBeforeAfter}
              style={{
                background: cinematicPreset === 'standard' ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cinematicPreset === 'standard' ? (isFr ? '✨ Activer les effets' : '✨ Enable effects') : (isFr ? '◻ Voir sans effets' : '◻ View raw mode')}</span>
            </button>
          </div>

          {/* Preset Profiles Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
              {isFr ? 'Profils Colorimétriques & Optiques Cinéma :' : 'Color Grading & Cinematic Optical Profiles:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {PRESET_CARDS.map(presetRaw => {
                const preset = getPresetCardInfo(presetRaw);
                const isSelected = cinematicPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? `2px solid ${preset.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                          {preset.title}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isSelected ? preset.color : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#020617' : '#94a3b8'
                      }}>
                        {preset.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                      {preset.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Sliders Tuning */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎛️</span>
              <span>{isFr ? 'Ajustements Optiques en Temps Réel :' : 'Real-Time Optical Fine-Tuning:'}</span>
            </div>

            {/* Bloom Intensity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>{isFr ? 'Intensité de Diffusion Bloom HDR (Lueurs & Émissifs)' : 'HDR Bloom Diffusion Intensity (Emissives & Glows)'}</span>
                <span style={{ fontFamily: 'monospace', color: '#34d399', fontWeight: 700 }}>{Math.round(bloomIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={bloomIntensity}
                onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            {/* Vignette Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>{isFr ? 'Vignettage Optique (Lentille Anamorphique 35mm)' : 'Optical Vignette (35mm Anamorphic Lens Falloff)'}</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{Math.round(vignetteStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={vignetteStrength}
                onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* Chromatic Aberration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>{isFr ? 'Aberration Chromatique (Dispersion périphérique RVB)' : 'Chromatic Aberration (RGB Edge Dispersion)'}</span>
                <span style={{ fontFamily: 'monospace', color: '#a855f7', fontWeight: 700 }}>{(chromaticAberration * 1000).toFixed(1)} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.008"
                step="0.0005"
                value={chromaticAberration}
                onChange={(e) => setChromaticAberration(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {isFr ? 'Effets appliqués dans le pipeline WebGL ; ils sont désactivés pendant la session XR.' : 'Effects applied in WebGL pipeline; automatically bypassed during WebXR sessions.'}
          </span>
          <button
            onClick={close}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
