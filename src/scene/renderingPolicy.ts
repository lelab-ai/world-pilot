export type RenderQuality = 'auto' | 'high' | 'economy';
export type VisualPreset = 'cinematic' | 'golden_hour' | 'cyberpunk_neon' | 'studio_neutral' | 'standard';

const HIGH = { maxDpr: 1.5, shadowMapSize: 2048, samples: 4, postprocessing: true } as const;
const ECONOMY = { maxDpr: 1, shadowMapSize: 1024, samples: 0, postprocessing: false } as const;

export function getRenderBudget(quality: RenderQuality, coarsePointer: boolean, isXR: boolean) {
  return isXR || quality === 'economy' || (quality === 'auto' && coarsePointer) ? ECONOMY : HIGH;
}

interface OpticalControls {
  bloomIntensity: number;
  vignetteStrength: number;
  chromaticAberration: number;
}

export function getCinematicSettings(preset: VisualPreset, controls: OpticalControls) {
  const neutral = preset === 'studio_neutral' || preset === 'standard';
  const golden = preset === 'golden_hour';
  const cyberpunk = preset === 'cyberpunk_neon';
  return {
    presetIndex: neutral ? 4 : golden ? 1 : cyberpunk ? 2 : 0,
    useComposer: !neutral,
    bloomStrength: neutral ? 0 : (golden ? 0.08 : cyberpunk ? 0.12 : 0.03) * controls.bloomIntensity,
    bloomRadius: golden ? 0.4 : cyberpunk ? 0.45 : 0.3,
    bloomThreshold: golden ? 1.6 : cyberpunk ? 1.4 : 1.7,
    exposure: golden ? 1.02 : 1,
    contrast: neutral ? 1 : golden ? 1.1 : cyberpunk ? 1.18 : 1.15,
    saturation: neutral ? 1 : golden ? 1.15 : cyberpunk ? 1.2 : 1.06,
    vignette: neutral ? 0 : 0.65 * controls.vignetteStrength,
    chromaticAberration: neutral ? 0 : controls.chromaticAberration,
    filmGrain: neutral ? 0 : 0.015,
  };
}
