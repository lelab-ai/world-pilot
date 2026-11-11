import React, { useState, useRef, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

export const AudioControlWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const audioVolume = useWorldStore(state => state.audioVolume);
  const isAudioMuted = useWorldStore(state => state.isAudioMuted);
  const setAudioVolume = useWorldStore(state => state.setAudioVolume);
  const toggleAudioMute = useWorldStore(state => state.toggleAudioMute);

  const isAmbientAudioActive = useWorldStore(state => state.isAmbientAudioActive);
  const toggleAmbientAudio = useWorldStore(state => state.toggleAmbientAudio);

  const isAgentSpeechEnabled = useWorldStore(state => state.isAgentSpeechEnabled);
  const toggleAgentSpeech = useWorldStore(state => state.toggleAgentSpeech);

  const currentAtmosphere = useWorldStore(state => state.currentAtmosphere);
  const setAtmosphere = useWorldStore(state => state.setAtmosphere);

  const [isHapticEnabled, setIsHapticEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('worldpilot_haptics_enabled');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });

  const toggleHaptics = () => {
    const next = !isHapticEnabled;
    setIsHapticEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('worldpilot_haptics_enabled', String(next));
      if (next && 'vibrate' in navigator) {
        try { navigator.vibrate([25, 40, 25]); } catch (_) {}
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getAudioIcon = () => {
    if (isAudioMuted || audioVolume <= 0.01) return '🔇';
    if (audioVolume < 0.33) return '🔈';
    if (audioVolume < 0.66) return '🔉';
    return '🔊';
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (isAudioMuted && val > 0) {
      toggleAudioMute();
    }
  };

  const handleTestSpecificSound = (e: React.MouseEvent, sound: 'chime' | 'sizzle_cook' | 'stir_whisk' | 'knife_chop' | 'fanfare') => {
    e.stopPropagation();
    playAudioFx(sound);
    if (isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([15, 30, 15]); } catch (_) {}
    }
  };

  const soundscapes = [
    { id: 'cozy-bistrot', label: '🍳 Bistrot Gourmand' },
    { id: 'le-refuge', label: '🏔️ Refuge Alpin' },
    { id: 'zen-garden', label: '🍃 Jardin Zen' },
    { id: 'paris-rain', label: '🌧️ Pluie Parisienne' },
    { id: 'earth-atelier', label: '✨ Atelier Design' },
  ];

  return (
    <div className="audio-control-wrapper" ref={containerRef}>
      <button
        className={`audio-trigger-btn ${isOpen ? 'active' : ''} ${isAudioMuted ? 'muted' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip={isOpen ? undefined : `Audio & Ambiance [M] (${isAudioMuted ? 'Muet' : Math.round(audioVolume * 100) + '%'})`}
        aria-label="Contrôle du volume et du son"
        aria-expanded={isOpen}
      >
        <span className="audio-icon">{getAudioIcon()}</span>
      </button>

      {isOpen && (
        <div className="audio-dropdown-menu" role="dialog" aria-label="Paramètres audio">
          <div className="audio-dropdown-header">
            <span>VOLUME & AUDIO MASTER</span>
            <button
              className={`audio-mute-toggle-btn ${isAudioMuted ? 'active-mute' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAudioMute();
              }}
              title="Activer ou couper le son [Raccourci M]"
            >
              {isAudioMuted ? '🔇 Muet (ON)' : '🔊 Son Actif'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="audio-slider-container">
            <div className="audio-slider-label-row">
              <span>Volume général</span>
              <b>{isAudioMuted ? '0% (Muet)' : `${Math.round(audioVolume * 100)}%`}</b>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isAudioMuted ? 0 : audioVolume}
              onChange={handleSliderChange}
              className="audio-range-slider"
              aria-label="Niveau du volume sonore"
            />
            <div className="audio-quick-presets">
              {[0.2, 0.5, 0.8, 1.0].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setAudioVolume(v);
                    if (isAudioMuted) toggleAudioMute();
                  }}
                  className={!isAudioMuted && Math.abs(audioVolume - v) < 0.06 ? 'selected' : ''}
                >
                  {Math.round(v * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Soundscapes Selector */}
          <div className="audio-soundscapes-section">
            <div className="audio-section-label">PAYSAGE SONORE AMBIANT</div>
            <div className="audio-soundscape-chips">
              {soundscapes.map(sc => (
                <button
                  key={sc.id}
                  className={`audio-soundscape-chip ${currentAtmosphere === sc.id ? 'active' : ''}`}
                  onClick={() => {
                    setAtmosphere(sc.id);
                    if (!isAmbientAudioActive) toggleAmbientAudio();
                  }}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary audio toggles */}
          <div className="audio-toggles-section">
            <button
              className={`audio-toggle-row ${isAmbientAudioActive ? 'active' : ''}`}
              onClick={toggleAmbientAudio}
            >
              <span>{isAmbientAudioActive ? '🍃' : '💨'} Ambiance sonore continue</span>
              <span className="toggle-badge">{isAmbientAudioActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              className={`audio-toggle-row ${isAgentSpeechEnabled ? 'active' : ''}`}
              onClick={toggleAgentSpeech}
            >
              <span>{isAgentSpeechEnabled ? '🗣️' : '🤫'} Voix de synthèse du Guide</span>
              <span className="toggle-badge">{isAgentSpeechEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              className={`audio-toggle-row ${isHapticEnabled ? 'active' : ''}`}
              onClick={toggleHaptics}
            >
              <span>{isHapticEnabled ? '📳' : '📴'} Vibrations tactiles / Haptique</span>
              <span className="toggle-badge">{isHapticEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Test Sound Palette */}
          <div className="audio-test-section">
            <div className="audio-section-label">PALETTE D’EFFETS SPATIAUX</div>
            <div className="audio-fx-palette">
              <button onClick={(e) => handleTestSpecificSound(e, 'chime')}>✨ Chime</button>
              <button onClick={(e) => handleTestSpecificSound(e, 'sizzle_cook')}>🍳 Sizzle</button>
              <button onClick={(e) => handleTestSpecificSound(e, 'stir_whisk')}>🌀 Remuer</button>
              <button onClick={(e) => handleTestSpecificSound(e, 'knife_chop')}>🔪 Découpe</button>
              <button onClick={(e) => handleTestSpecificSound(e, 'fanfare')}>🎉 Fanfare</button>
            </div>
            <div className="audio-test-footer">
              <span className="audio-shortcut-hint">Raccourci volume : <b>[M]</b></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
