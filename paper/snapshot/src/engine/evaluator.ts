import { WorldState, WorldEvent, SoundEffect } from '../core/types';
import { ambientAudio } from './ambientAudio';
import { xrHaptics } from '../scene/xrHaptics';

/**
 * Result of evaluating an event against the rules.
 */
export interface EvaluationResult {
  newState: WorldState;
  warnings: string[];
  matchedRulesCount: number;
}

let audioWindowStart = 0;
let audioCallsInWindow = 0;

export function playAudioFx(
  sound: SoundEffect = 'ping',
  pos?: { x: number; y: number; z: number } | [number, number, number]
) {
  try {
    if (typeof window === 'undefined') return;

    // Protection anti-emballement : limiter le nombre de déclenchements simultanés (évite boucle infinie et son continu)
    const nowMs = Date.now();
    if (nowMs - audioWindowStart > 250) {
      audioWindowStart = nowMs;
      audioCallsInWindow = 0;
    }
    audioCallsInWindow++;
    if (audioCallsInWindow > 8) {
      return;
    }

    // Dispatch synchronous haptic pulse if XR VR is active
    if (sound === 'electric_spark' || sound === 'explosion') {
      xrHaptics.triggerHaptic('warning_shock');
    } else if (sound === 'quantum_ping' || sound === 'fanfare') {
      xrHaptics.triggerHaptic('quantum_chime');
    } else if (sound === 'switch_click' || sound === 'target_hit' || sound === 'snap_connect') {
      xrHaptics.triggerHaptic('snap_connect');
    } else if (sound === 'snap_release') {
      xrHaptics.triggerHaptic('snap_release');
    } else if (sound === 'impact_wood') {
      xrHaptics.triggerHaptic('impact_wood');
    } else if (sound === 'impact_metal') {
      xrHaptics.triggerHaptic('impact_metal');
    } else if (sound === 'impact_stone') {
      xrHaptics.triggerHaptic('impact_stone');
    } else if (sound === 'knife_chop') {
      xrHaptics.triggerHaptic('chop_slice');
    } else {
      xrHaptics.triggerHaptic('subtle_tap');
    }

    if (ambientAudio.isAudioMuted()) return;
    const effVol = ambientAudio.getEffectiveVolume();
    if (effVol <= 0.001) return;

    let ctx = ambientAudio.getContext();
    let rawDest: AudioNode;
    if (ctx && ambientAudio.getMasterGain()) {
      rawDest = ambientAudio.getMasterGain()!;
    } else {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      rawDest = ctx.destination;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    let destNode: AudioNode = rawDest;
    if (pos && ctx.createPanner) {
      try {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 15;
        panner.rolloffFactor = 1;
        const px = Array.isArray(pos) ? pos[0] : pos.x;
        const py = Array.isArray(pos) ? pos[1] : pos.y;
        const pz = Array.isArray(pos) ? pos[2] : pos.z;
        if (panner.positionX && panner.positionX.setValueAtTime) {
          panner.positionX.setValueAtTime(px, now);
          panner.positionY.setValueAtTime(py, now);
          panner.positionZ.setValueAtTime(pz, now);
        } else if ((panner as any).setPosition) {
          (panner as any).setPosition(px, py, pz);
        }
        panner.connect(rawDest);
        try {
          const reverbNode = ambientAudio.getReverbNode();
          if (reverbNode) {
            panner.connect(reverbNode);
          }
        } catch (_) {}
        destNode = panner;
      } catch (_) {}
    }

    if (sound === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (sound === 'explosion') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (sound === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (sound === 'bell') {
      // Metallic dual-harmonic bell
      [523.25, 1046.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } else if (sound === 'coffee_brew') {
      // White noise stream with low-pass filter to simulate espresso extraction & steaming
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
      filter.frequency.linearRampToValueAtTime(400, now + 0.8);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      noise.start(now);
      noise.stop(now + 0.8);
    } else if (sound === 'switch_click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (sound === 'pour_water') {
      // Realistic liquid stream: filtered pink noise stream + rising pitch resonant bubble pops
      const bufferSize = Math.floor(ctx.sampleRate * 0.85);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.28;
      }
      const stream = ctx.createBufferSource();
      stream.buffer = buffer;
      const streamFilter = ctx.createBiquadFilter();
      streamFilter.type = 'bandpass';
      streamFilter.frequency.setValueAtTime(420, now);
      streamFilter.frequency.linearRampToValueAtTime(780, now + 0.85);
      streamFilter.Q.setValueAtTime(3.2, now);
      const streamGain = ctx.createGain();
      streamGain.gain.setValueAtTime(0.01, now);
      streamGain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      streamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      stream.connect(streamFilter);
      streamFilter.connect(streamGain);
      streamGain.connect(destNode);
      stream.start(now);
      stream.stop(now + 0.85);

      // Multi-frequency liquid bubble pops
      [0.08, 0.22, 0.38, 0.54, 0.70].forEach((delay, idx) => {
        const t = now + delay;
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.connect(popGain);
        popGain.connect(destNode);
        popOsc.type = 'sine';
        const startFreq = 300 + idx * 75 + Math.random() * 30;
        popOsc.frequency.setValueAtTime(startFreq, t);
        popOsc.frequency.exponentialRampToValueAtTime(startFreq * 1.8, t + 0.045);
        popGain.gain.setValueAtTime(0.18, t);
        popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        popOsc.start(t);
        popOsc.stop(t + 0.045);
      });
    } else if (sound === 'ignite_fire') {
      // Crisp match strike friction followed by warm airy combustion whoosh
      const strikeOsc = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strikeOsc.connect(strikeGain);
      strikeGain.connect(destNode);
      strikeOsc.type = 'sawtooth';
      strikeOsc.frequency.setValueAtTime(2400, now);
      strikeOsc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      strikeGain.gain.setValueAtTime(0.35, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.05);

      const bufferSize = Math.floor(ctx.sampleRate * 0.75);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const flame = ctx.createBufferSource();
      flame.buffer = buffer;
      const flameFilter = ctx.createBiquadFilter();
      flameFilter.type = 'lowpass';
      flameFilter.frequency.setValueAtTime(320, now + 0.04);
      flameFilter.frequency.linearRampToValueAtTime(950, now + 0.25);
      flameFilter.frequency.linearRampToValueAtTime(220, now + 0.75);
      const flameGain = ctx.createGain();
      flameGain.gain.setValueAtTime(0.001, now + 0.04);
      flameGain.gain.linearRampToValueAtTime(0.28, now + 0.18);
      flameGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      flame.connect(flameFilter);
      flameFilter.connect(flameGain);
      flameGain.connect(destNode);
      flame.start(now + 0.04);
      flame.stop(now + 0.75);
    } else if (sound === 'sizzle_cook' || sound === 'sizzle') {
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(3, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      noise.start(now);
      noise.stop(now + 0.6);
    } else if (sound === 'knife_chop') {
      // Crisp rhythmic double-tap of knife blade striking wooden cutting board
      [0, 0.12].forEach((delay) => {
        const t = now + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.05);
        gain.gain.setValueAtTime(0.38, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);

        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(destNode);
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(1700, t);
        clickGain.gain.setValueAtTime(0.15, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
        clickOsc.start(t);
        clickOsc.stop(t + 0.018);
      });
    } else if (sound === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.3, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else if (sound === 'bubbles') {
      [300, 450, 600, 750].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + i * 0.09 + 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.09 + 0.08);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.08);
      });
    } else if (sound === 'sparkle') {
      [1200, 1500, 1800, 2200, 2600].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    } else if (sound === 'game_over') {
      // Descending minor thud & dissonance
      [320, 240, 160, 90].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.35, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
    } else if (sound === 'target_hit') {
      // High-impact electronic metallic tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (sound === 'countdown_beep') {
      // Crisp retro chronometer pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (sound === 'stir_whisk') {
      // Fluid circular swirling vortex: filtered noise swoosh + resonant wooden utensil glide
      const bufferSize = ctx.sampleRate * 0.9;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.linearRampToValueAtTime(750, now + 0.45);
      filter.frequency.linearRampToValueAtTime(360, now + 0.9);
      filter.Q.setValueAtTime(2.5, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.25);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destNode);
      noise.start(now);
      noise.stop(now + 0.9);

      // Resonant harmonic wooden contact glide
      [240, 360].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        osc.frequency.linearRampToValueAtTime(freq * 1.25, now + 0.5 + idx * 0.1);
        osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 0.85);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc.start(now + idx * 0.1);
        osc.stop(now + 0.85);
      });
    } else if (sound === 'tink') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1864, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (sound === 'electric_spark') {
      // Procedural electrostatic discharge: high-frequency noise burst + sudden square snap
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.5, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      whiteNoise.start(now);
    } else if (sound === 'quantum_ping') {
      // Resonant harmonic chime: deep sub sine + crystalline overtone
      [440, 880, 1760, 3520].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } else if (sound === 'paper_turn') {
      // Tactile page flip: filtered pink noise brush with fast exponential decay
      const bufferSize = Math.floor(ctx.sampleRate * 0.14);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.08;
        output[i] = (b0 + b1) * Math.exp(-i / (bufferSize * 0.45));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      noise.start(now);
    } else if (sound === 'snap_connect') {
      // Harmonic magnetic snap: dual pure sine chime (528Hz & 792Hz) + tactile click
      [528, 792].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.22 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      });
      const tapOsc = ctx.createOscillator();
      const tapGain = ctx.createGain();
      tapOsc.connect(tapGain);
      tapGain.connect(destNode);
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(240, now);
      tapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.035);
      tapGain.gain.setValueAtTime(0.28, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      tapOsc.start(now);
      tapOsc.stop(now + 0.035);
    } else if (sound === 'snap_release') {
      // Tactile release pop: declining frequency sine chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (sound === 'impact_wood') {
      // Warm wooden acoustic knock: low resonant thud + filtered knock click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);

      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.connect(clickGain);
      clickGain.connect(destNode);
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(920, now);
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      clickOsc.start(now);
      clickOsc.stop(now + 0.022);
    } else if (sound === 'impact_metal') {
      // Metallic strike: inharmonic dual ringing resonance (640Hz & 1520Hz) + sharp initial click
      [640, 1520].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(destNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.24 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      });
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.connect(clickGain);
      clickGain.connect(destNode);
      click.type = 'sawtooth';
      click.frequency.setValueAtTime(2800, now);
      clickGain.gain.setValueAtTime(0.18, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      click.start(now);
      click.stop(now + 0.018);
    } else if (sound === 'impact_stone') {
      // Crisp stone / ceramic tile impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (sound === 'drag_whoosh') {
      // Aerodynamic motion whoosh for rapid 3D translation
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(820, now + 0.08);
      filter.frequency.linearRampToValueAtTime(320, now + 0.16);
      filter.Q.setValueAtTime(1.8, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);
      noise.start(now);
      noise.stop(now + 0.16);
    } else if (sound === 'soft_drop') {
      // Damped acoustic landing thud: low frequency resonant impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(destNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn("Audio error", err);
  }
}

/**
 * Evaluates rules deterministically.
 */
export function evaluateEvent(state: WorldState, event: WorldEvent): EvaluationResult {
  const newState: WorldState = JSON.parse(JSON.stringify(state)); // deep copy for now
  const warnings: string[] = [];
  
  // Default physics/interaction behavior: DROP moves source to target when not already placed by 3D snapping
  if (event.type === 'DROP' && event.sourceId && event.targetId) {
    const sourceEnt = newState.ir.entities[event.sourceId];
    const targetEnt = newState.ir.entities[event.targetId];
    if (sourceEnt && targetEnt) {
      const sourceTransform = sourceEnt.capabilities.find(c => c.type === 'transform');
      const targetTransform = targetEnt.capabilities.find(c => c.type === 'transform');
      if (sourceTransform && targetTransform && targetTransform.position) {
        const sPos = sourceTransform.position as any;
        const tPos = targetTransform.position as any;
        const sx = Array.isArray(sPos) ? (sPos[0] ?? 0) : (sPos?.x ?? 0);
        const sz = Array.isArray(sPos) ? (sPos[2] ?? 0) : (sPos?.z ?? 0);
        const tx = Array.isArray(tPos) ? (tPos[0] ?? 0) : (tPos.x ?? 0);
        const ty = Array.isArray(tPos) ? (tPos[1] ?? 0) : (tPos.y ?? 0);
        const tz = Array.isArray(tPos) ? (tPos[2] ?? 0) : (tPos.z ?? 0);
        if (Math.hypot(sx - tx, sz - tz) > 0.45) {
          sourceTransform.position = {
            x: tx,
            y: Number((ty + 0.04).toFixed(3)),
            z: tz
          };
        }
      }
    }
  }

  // Find matching rules
  const isInteractFamily = (t: string) => t === 'INTERACT' || t === 'INTERACTION' || t === 'CLICK' || t === 'INSPECT';
  const eventTypeUpper = (event.type || '').trim().toUpperCase();
  const isUnaryInteract = isInteractFamily(eventTypeUpper);
  const effectiveTargetId = event.targetId || (isUnaryInteract ? event.sourceId : undefined);
  const effectiveSourceId = event.sourceId || (isUnaryInteract ? event.targetId : undefined);
  const rules = Object.values(newState.ir.rules).filter(r => {
    const rawTrigger = (r.trigger || '').trim();
    const baseTrigger = (rawTrigger.includes(':') ? rawTrigger.split(':')[0].trim() : rawTrigger).toUpperCase();
    if (baseTrigger === eventTypeUpper) return true;
    if (isInteractFamily(baseTrigger) && isUnaryInteract) return true;
    return false;
  });
  let matchedRulesCount = 0;
  
  for (const rule of rules) {
    let conditionsMet = true;
    const rawRuleTrigger = (rule.trigger || '').trim();
    if (rawRuleTrigger.includes(':')) {
      const triggerTargetId = rawRuleTrigger.split(':')[1]?.trim();
      if (triggerTargetId && effectiveSourceId !== triggerTargetId && effectiveTargetId !== triggerTargetId) {
        conditionsMet = false;
      }
    }
    
    // Evaluate conditions
    for (const rawCond of rule.conditions) {
      const cond = rawCond?.property === 'sourceId' && !rawCond.type
        ? { ...rawCond, type: 'is_source', sourceId: rawCond.sourceId || rawCond.value }
        : rawCond?.property === 'targetId' && !rawCond.type
          ? { ...rawCond, type: 'is_target', targetId: rawCond.targetId || rawCond.value }
          : rawCond;
      if (cond.type === 'is_target') {
        let isTgtMatch = effectiveTargetId === cond.targetId;
        if (!isTgtMatch && effectiveTargetId && cond.targetId) {
          const t = effectiveTargetId.toLowerCase();
          const c = cond.targetId.toLowerCase();
          if (t.includes(c) || c.includes(t)) isTgtMatch = true;
          if ((t.includes('auth') || t.includes('cockpit') || t.includes('dock') || t.includes('zone')) &&
              (c.includes('auth') || c.includes('cockpit') || c.includes('dock') || c.includes('zone'))) {
            isTgtMatch = true;
          }
          const tgtEnt = newState.ir.entities[effectiveTargetId];
          if (tgtEnt) {
            const tName = (tgtEnt.name || '').toLowerCase();
            if (tName.includes(c) || (c.includes('auth') && tName.includes('auth')) || (c.includes('cockpit') && tName.includes('cockpit'))) {
              isTgtMatch = true;
            }
          }
        }
        if (!isTgtMatch) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'is_source') {
        let isSrcMatch = effectiveSourceId === cond.sourceId;
        if (!isSrcMatch && effectiveSourceId && cond.sourceId) {
          const s = effectiveSourceId.toLowerCase();
          const c = cond.sourceId.toLowerCase();
          if (s.includes(c) || c.includes(s)) isSrcMatch = true;
          if ((s.includes('configur') || s.includes('terminal') || s.includes('borne') || s.includes('console') || s.includes('holograph') || s.includes('teinte')) &&
              (c.includes('configur') || c.includes('terminal') || c.includes('borne') || c.includes('console') || c.includes('holograph') || c.includes('teinte'))) {
            isSrcMatch = true;
          }
          if ((s.includes('start') || s.includes('moteur') || s.includes('key') || s.includes('cle') || s.includes('clé')) &&
              (c.includes('start') || c.includes('moteur') || c.includes('key') || c.includes('cle') || c.includes('clé'))) {
            isSrcMatch = true;
          }
          if ((s.includes('supercar') || s.includes('voiture')) &&
              (c.includes('supercar') || c.includes('voiture'))) {
            isSrcMatch = true;
          }
          const srcEnt = newState.ir.entities[effectiveSourceId];
          if (srcEnt) {
            const sName = (srcEnt.name || '').toLowerCase();
            if (sName.includes(c) ||
                ((c.includes('configur') || c.includes('console') || c.includes('holograph')) && (sName.includes('configur') || sName.includes('console') || sName.includes('holograph') || sName.includes('teinte')))) {
              isSrcMatch = true;
            }
          }
        }
        if (!isSrcMatch) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'require_flag') {
        const currentVal = newState.flags?.[cond.flag];
        if (cond.value === false) {
          if (Boolean(currentVal)) {
            conditionsMet = false;
            break;
          }
        } else if (cond.value !== undefined && cond.value !== true) {
          if (currentVal !== cond.value) {
            conditionsMet = false;
            break;
          }
        } else if (!currentVal) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'min_force') {
        const force = event.payload?.force || 0;
        if (force < cond.force) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'min_score') {
        const score = newState.gameplay?.score || 0;
        const required = cond.minScore ?? cond.score ?? 0;
        if (score < required) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'max_score') {
        const score = newState.gameplay?.score || 0;
        const maxScore = cond.maxScore ?? cond.score ?? 0;
        if (score > maxScore) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'timer_expired') {
        if ((newState.gameplay?.timer ?? 1) > 0) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'flag_equals') {
        if (newState.flags[cond.flag] !== cond.value) {
          conditionsMet = false;
          break;
        }
      }
      if (cond.type === 'proximity' || cond.type === 'in_zone') {
        if (cond.targetId && cond.targetId !== '*') {
          const condTargetLow = cond.targetId.toLowerCase();
          const evtTargetLow = (event.targetId || '').toLowerCase();
          const evtSourceLow = (event.sourceId || '').toLowerCase();
          const isMatch =
            cond.targetId === event.targetId ||
            cond.targetId === event.sourceId ||
            (evtTargetLow && (evtTargetLow.includes(condTargetLow) || condTargetLow.includes(evtTargetLow))) ||
            (evtSourceLow && (evtSourceLow.includes(condTargetLow) || condTargetLow.includes(evtSourceLow)));
          if (!isMatch) {
            conditionsMet = false;
            break;
          }
        }
        if (cond.sourceId && cond.sourceId !== '*') {
          const condSrcLow = cond.sourceId.toLowerCase();
          const evtSrcLow = (event.sourceId || '').toLowerCase();
          const isSrcMatch =
            cond.sourceId === event.sourceId ||
            (evtSrcLow && (evtSrcLow.includes(condSrcLow) || condSrcLow.includes(evtSrcLow)));
          if (!isSrcMatch) {
            conditionsMet = false;
            break;
          }
        }
      }
    }
    
    if (conditionsMet) {
      matchedRulesCount++;
      // Execute actions
      for (const action of rule.actions) {
        if (action.type === 'show_warning') {
          warnings.push(action.message || 'Warning triggered');
        } else if (action.type === 'open_url') {
          if (action.url && typeof window !== 'undefined' && typeof window.open === 'function') {
            window.open(action.url, '_blank');
          }
        } else if (action.type === 'reset_position' || action.type === 'teleport') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          const entity = targetId ? newState.ir.entities[targetId] : undefined;
          if (entity) {
            const rawPos: any = action.position;
            const nextPos = Array.isArray(rawPos) && rawPos.length >= 3
              ? { x: Number(rawPos[0]) || 0, y: Number(rawPos[1]) || 0, z: Number(rawPos[2]) || 0 }
              : rawPos && typeof rawPos === 'object'
                ? { x: Number(rawPos.x) || 0, y: Number(rawPos.y) || 0, z: Number(rawPos.z) || 0 }
                : { x: 0, y: 0, z: 0 };
            // Find transform capability and reset it
            const transform = entity.capabilities.find(c => c.type === 'transform');
            if (transform) {
              transform.position = nextPos;
            } else {
              // Add transform capability if missing
              entity.capabilities.push({
                type: 'transform',
                position: nextPos
              });
            }
          }
        } else if (action.type === 'set_flag') {
          if (!newState.flags) newState.flags = {};
          if (action.flag) {
            newState.flags[action.flag] = action.value !== undefined ? action.value : true;
          }
        } else if (action.type === 'fire_webhook' && action.url) {
          fetch(action.url, {
            method: 'POST',
            body: JSON.stringify(action.payload || {}),
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error("Webhook failed", err));
          warnings.push(`Fired webhook to ${action.url}`);
        } else if (action.type === 'destroy_entity') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          if (targetId && newState.ir.entities[targetId]) {
            const name = newState.ir.entities[targetId].name || targetId;
            delete newState.ir.entities[targetId];
            warnings.push(`💥 ${name} a été détruit !`);
          }
        } else if (action.type === 'play_sound') {
          playAudioFx(action.sound || 'ping');
          warnings.push(`🔊 Son joué (${action.sound || 'ping'})`);
        } else if (action.type === 'change_color') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          let entity = targetId ? newState.ir.entities[targetId] : null;
          if (!entity && targetId) {
            const tLow = targetId.toLowerCase();
            entity = Object.values(newState.ir.entities).find(e =>
              e.id.toLowerCase().includes(tLow) ||
              tLow.includes(e.id.toLowerCase()) ||
              (e.name || '').toLowerCase().includes(tLow)
            ) || null;
          }
          if (entity && action.color) {
            if (!entity.visuals) entity.visuals = {};
            entity.visuals.color = action.color;
            warnings.push(`🎨 ${entity.name || targetId} a changé de couleur !`);
          }
        } else if (action.type === 'mint_nft') {
          playAudioFx('chime');
          const simId = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
          const nftPayload = {
            nftName: action.nftName || 'Casque Victoria VR Prototype #042',
            token: action.token || 'VR',
            simulationId: simId,
            simulated: true,
            timestamp: new Date().toLocaleTimeString()
          };
          if (!newState.flags) newState.flags = {};
          newState.flags['nft_minted'] = false;
          newState.flags['nft_mint_simulated'] = true;
          warnings.push(`💎 [Simulation locale] NFT ${nftPayload.nftName} — intégration on-chain non connectée.`);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('victoria_vr_mint', { detail: nftPayload }));
          }
        } else if (action.type === 'trigger_animation') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          const entity = targetId ? newState.ir.entities[targetId] : null;
          if (entity) {
            const existingAnim = entity.capabilities.find(c => c.type === 'animated');
            if (existingAnim) {
              existingAnim.animationType = action.animationType || 'floating';
              existingAnim.active = true;
            } else {
              entity.capabilities.push({
                type: 'animated',
                animationType: action.animationType || 'floating',
                active: true
              });
            }
            warnings.push(`✨ Animation [${action.animationType || 'floating'}] activée sur ${entity.name || targetId}`);
          }
        } else if (action.type === 'emit_particles') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          if (!newState.flags) newState.flags = {};
          newState.flags[`particles_${targetId}`] = true;
          warnings.push(`🌟 Émission de particules sur ${targetId}`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_particles', { detail: { targetId, animationType: action.animationType } }));
          }
        } else if (action.type === 'spawn_entity') {
          if (action.spawnEntitySpec) {
            newState.ir.entities[action.spawnEntitySpec.id] = action.spawnEntitySpec;
            warnings.push(`✨ Nouvel élément créé : ${action.spawnEntitySpec.name}`);
          }
        } else if (action.type === 'set_atmosphere') {
          if (action.atmosphere) {
            if (!newState.flags) newState.flags = {};
            newState.flags[`atmosphere_${action.atmosphere}`] = true;
            warnings.push(`🌅 Ambiance basculée sur : ${action.atmosphere}`);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: action.atmosphere } }));
            }
          }
        } else if (action.type === 'increment_score') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          const delta = action.scoreDelta || 10;
          newState.gameplay.score += delta;
          if (newState.gameplay.score > newState.gameplay.highScore) {
            newState.gameplay.highScore = newState.gameplay.score;
          }
          if (!newState.flags) newState.flags = {};
          if (newState.gameplay.score >= 200) newState.flags['score_ge_200'] = true;
          if (newState.gameplay.score >= 300) newState.flags['score_ge_300'] = true;
          if (newState.gameplay.score >= 500) newState.flags['score_ge_500'] = true;
          warnings.push(`🏆 Score : ${newState.gameplay.score} (+${delta})`);
          if (
            (newState.gameplay.gameMode === 'target_range' && newState.gameplay.score >= 200 && newState.gameplay.gameStatus !== 'victory') ||
            (newState.gameplay.gameMode === 'gem_collector' && newState.gameplay.score >= 500 && newState.gameplay.gameStatus !== 'victory')
          ) {
            newState.gameplay.gameStatus = 'victory';
            newState.gameplay.isTimerActive = false;
            newState.flags['victory_achieved'] = true;
            playAudioFx('fanfare');
            warnings.push(
              newState.gameplay.gameMode === 'target_range'
                ? '🎉 VICTOIRE ! Toutes les cibles abattues (200 pts) !'
                : '🎉 VICTOIRE ! Les 5 Orbes Célestes ont été collectés (500 pts) !'
            );
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_victory', { detail: { score: newState.gameplay.score } }));
            }
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_score_updated', { detail: { score: newState.gameplay.score, delta } }));
          }
        } else if (action.type === 'decrement_score') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          const delta = action.scoreDelta || 10;
          newState.gameplay.score = Math.max(0, newState.gameplay.score - delta);
          warnings.push(`⚠️ Score : ${newState.gameplay.score} (-${delta})`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_score_updated', { detail: { score: newState.gameplay.score, delta: -delta } }));
          }
        } else if (action.type === 'adjust_lives') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          const delta = action.livesDelta !== undefined ? action.livesDelta : -1;
          newState.gameplay.lives = Math.max(0, Math.min(newState.gameplay.maxLives || 3, newState.gameplay.lives + delta));
          warnings.push(`❤️ Vies : ${newState.gameplay.lives}/${newState.gameplay.maxLives}`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_lives_updated', { detail: { lives: newState.gameplay.lives, maxLives: newState.gameplay.maxLives } }));
          }
          if (newState.gameplay.lives <= 0) {
            newState.gameplay.gameStatus = 'game_over';
            newState.gameplay.isTimerActive = false;
            playAudioFx('game_over');
            warnings.push(`💀 GAME OVER : Plus de vies restantes !`);
            if (!newState.flags) newState.flags = {};
            newState.flags['game_over'] = true;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_game_over', { detail: { reason: 'no_lives' } }));
            }
          }
        } else if (action.type === 'set_timer') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          const duration = action.duration || 30;
          newState.gameplay.timer = duration;
          newState.gameplay.isTimerActive = true;
          warnings.push(`⏱️ Chronomètre démarré : ${duration}s`);
        } else if (action.type === 'trigger_victory') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          newState.gameplay.gameStatus = 'victory';
          newState.gameplay.isTimerActive = false;
          if (!newState.flags) newState.flags = {};
          newState.flags['victory_achieved'] = true;
          playAudioFx('fanfare');
          warnings.push(action.message || '🎉 VICTOIRE ! Défi accompli avec succès !');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_victory', { detail: { score: newState.gameplay.score } }));
          }
        } else if (action.type === 'trigger_game_over') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          }
          newState.gameplay.gameStatus = 'game_over';
          newState.gameplay.isTimerActive = false;
          if (!newState.flags) newState.flags = {};
          newState.flags['game_over'] = true;
          playAudioFx('game_over');
          warnings.push(action.message || '💀 GAME OVER !');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_game_over', { detail: { message: action.message } }));
          }
        } else if (action.type === 'reset_game') {
          if (!newState.gameplay) {
            newState.gameplay = { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' };
          } else {
            newState.gameplay.score = 0;
            newState.gameplay.lives = newState.gameplay.maxLives || 3;
            newState.gameplay.gameStatus = 'running';
            newState.gameplay.isTimerActive = false;
          }
          newState.flags = {};
          warnings.push('🔄 Boucle de jeu réinitialisée');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_game_reset', { detail: {} }));
          }
        } else if (action.type === 'apply_impulse') {
          const targetId = action.entityId || action.targetId || event.sourceId || event.targetId;
          warnings.push(`🚀 Impulsion physique appliquée sur ${targetId}`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_apply_impulse', { detail: { entityId: targetId, impulse: action.impulse } }));
          }
        } else if (action.type === 'toggle_state') {
          const targetId = action.entityId || action.targetId || event.targetId || event.sourceId;
          const entity = targetId ? newState.ir.entities[targetId] : null;
          if (entity) {
            const curState = entity.state || 'closed';
            const available = entity.availableStates || ['closed', 'open'];
            const nextIdx = (available.indexOf(curState) + 1) % available.length;
            const nextState = action.state || (event.payload?.targetState as string) || (event.payload?.newState as string) || available[nextIdx] || (curState === 'closed' ? 'open' : 'closed');
            entity.state = nextState;
            if (!newState.flags) newState.flags = {};
            available.forEach(s => {
              newState.flags[`${targetId}_state_${s}`] = (s === nextState);
            });
            newState.flags[`${targetId}_state_${nextState}`] = true;
            newState.flags[`${targetId}_open`] = nextState === 'open';
            playAudioFx('switch_click');
            warnings.push(`🔄 État de ${entity.name} changé : [${nextState.toUpperCase()}]`);
          }
        } else if (action.type === 'set_relation') {
          const srcId = action.sourceEntityId || event.sourceId;
          const tgtId = action.targetEntityId || action.targetId || event.targetId;
          if (srcId && tgtId && newState.ir.entities[srcId] && newState.ir.entities[tgtId] && action.relation) {
            const src = newState.ir.entities[srcId];
            if (!src.relations) src.relations = [];
            src.relations = src.relations.filter(r => !(r.type === action.relation!.type && r.targetId === tgtId));
            src.relations.push(action.relation);
            warnings.push(`🔗 Relation sémantique : ${src.name} [${action.relation.type.toUpperCase()}] ➔ ${newState.ir.entities[tgtId].name}`);
          }
        } else if (action.type === 'test_spatial_capacity') {
          const containerId = action.targetEntityId || action.targetId || event.targetId;
          const itemId = action.sourceEntityId || action.entityId || event.sourceId;
          const container = containerId ? newState.ir.entities[containerId] : null;
          const item = itemId ? newState.ir.entities[itemId] : null;
          if (container && item && containerId && itemId) {
            const itemDims = item.physicalProperties?.dimensions || [0.35, 0.02, 0.25];
            const compatRel = item.relations?.find(r => r.type === 'compatible_with' && r.targetId === containerId);
            const targetPart = action.partId
              ? container.parts?.find(p => p.id === action.partId)
              : (compatRel?.metadata?.targetPart
                  ? container.parts?.find(p => p.id === compatRel.metadata!.targetPart)
                  : undefined) ||
                container.parts?.find(p =>
                  p.fitsMaxDimensions &&
                  itemDims[0] <= p.fitsMaxDimensions[0] &&
                  itemDims[1] <= p.fitsMaxDimensions[1] &&
                  itemDims[2] <= p.fitsMaxDimensions[2]
                );
            const maxDims = targetPart?.fitsMaxDimensions || container.physicalProperties?.fitsMaxDimensions || [0.38, 0.03, 0.28];
            const fits = Boolean(compatRel) || (itemDims[0] <= maxDims[0] && itemDims[1] <= maxDims[1] && itemDims[2] <= maxDims[2]);
            
            if (!newState.flags) newState.flags = {};
            newState.flags[`capacity_test_${itemId}_in_${containerId}`] = fits;
            
            if (fits) {
              if (!item.relations) item.relations = [];
              item.relations = item.relations.filter(r => r.type !== 'inside');
              item.relations.push({ type: 'inside', targetId: containerId, metadata: { partId: targetPart?.id || action.partId || 'part_laptop_sleeve' } });
              
              const cTr = container.capabilities.find(c => c.type === 'transform');
              const iTr = item.capabilities.find(c => c.type === 'transform');
              if (cTr?.position && iTr) {
                const rawCPos: any = cTr.position;
                const cx = Array.isArray(rawCPos) ? Number(rawCPos[0]) || 0 : Number(rawCPos.x) || 0;
                const cy = Array.isArray(rawCPos) ? Number(rawCPos[1]) || 0 : Number(rawCPos.y) || 0;
                const cz = Array.isArray(rawCPos) ? Number(rawCPos[2]) || 0 : Number(rawCPos.z) || 0;
                iTr.position = { x: cx, y: Number((cy + 0.15).toFixed(3)), z: cz };
              }
              
              playAudioFx('chime');
              warnings.push(`✅ TEST DE CAPACITÉ VALIDÉ : "${item.name}" rentre parfaitement dans "${container.name}" !`);
            } else {
              // Restore original item position if generic DROP moved it onto the container
              const origItem = state.ir.entities[itemId];
              const origTr = origItem?.capabilities.find(c => c.type === 'transform');
              const iTr = item.capabilities.find(c => c.type === 'transform');
              if (origTr?.position && iTr) {
                const rawOrigPos: any = origTr.position;
                iTr.position = Array.isArray(rawOrigPos) && rawOrigPos.length >= 3
                  ? { x: Number(rawOrigPos[0]) || 0, y: Number(rawOrigPos[1]) || 0, z: Number(rawOrigPos[2]) || 0 }
                  : { x: Number(rawOrigPos.x) || 0, y: Number(rawOrigPos.y) || 0, z: Number(rawOrigPos.z) || 0 };
              }
              playAudioFx('bell');
              warnings.push(`❌ DÉPASSEMENT DE GABARIT : "${item.name}" (${(itemDims[0]*100).toFixed(0)}x${(itemDims[2]*100).toFixed(0)}cm) dépasse le volume de "${container.name}" !`);
            }
          }
        }
      }
    }
  }

  // If no rule matched, check default entity interactions (e.g. state toggle on entities with availableStates)
  if (matchedRulesCount === 0 && (event.type === 'INTERACT' || event.type === 'TOGGLE_STATE') && event.sourceId) {
    const ent = newState.ir.entities[event.sourceId];
    if (ent && ent.availableStates && ent.availableStates.length > 0) {
      const curState = ent.state || ent.availableStates[0];
      const available = ent.availableStates;
      const nextIdx = (available.indexOf(curState) + 1) % available.length;
      const nextState = (event.payload?.targetState as string) || (event.payload?.newState as string) || available[nextIdx];
      ent.state = nextState;
      if (!newState.flags) newState.flags = {};
      available.forEach(s => {
        newState.flags[`${event.sourceId}_state_${s}`] = (s === nextState);
      });
      newState.flags[`${event.sourceId}_state_${nextState}`] = true;
      newState.flags[`${event.sourceId}_open`] = nextState === 'open';
      playAudioFx('switch_click');
      warnings.push(`🔄 État de ${ent.name} changé : [${nextState.toUpperCase()}]`);
      matchedRulesCount++;
    }
  }
  
  // Evaluate Active Quest Progression
  if (newState.ir.quests) {
    const activeQuestId = newState.ir.activeQuestId || Object.keys(newState.ir.quests)[0];
    const quest = activeQuestId ? newState.ir.quests[activeQuestId] : null;
    if (quest) {
      // Invalidation causale réactive si un drapeau est forcé à false
      if (event.type === 'FLAG_CHANGED' && event.payload?.value === false && typeof event.payload?.flag === 'string') {
        const falseFlag = event.payload.flag;
        let invalidatedAny = false;
        const rulesList = Object.values(newState.ir.rules || {});

        for (let i = 0; i < quest.steps.length; i++) {
          const step = quest.steps[i];
          const stepId = step.id || '';

          // 1. La règle de cette étape produit-elle ce drapeau ?
          const isFlagProducer = rulesList.some(r =>
            Array.isArray(r.actions) &&
            r.actions.some(a => a.type === 'set_flag' && a.flag === falseFlag) &&
            Array.isArray(r.conditions) &&
            r.conditions.some(c =>
              (c.type === 'is_source' && (c.sourceId === step.targetEntityId || (step.requiredEvent || '').includes(c.sourceId))) ||
              (c.type === 'is_target' && (c.targetId === step.targetZoneId || (step.requiredEvent || '').includes(c.targetId)))
            )
          );

          // 2. Cette étape ou sa règle exige-t-elle ce drapeau comme précondition ?
          const isFlagRequired = rulesList.some(r =>
            Array.isArray(r.conditions) &&
            r.conditions.some(c => c.type === 'require_flag' && c.flag === falseFlag) &&
            r.conditions.some(c =>
              (c.type === 'is_source' && (c.sourceId === step.targetEntityId || (step.requiredEvent || '').includes(c.sourceId))) ||
              (c.type === 'is_target' && (c.targetId === step.targetZoneId || (step.requiredEvent || '').includes(c.targetId)))
            )
          );

          // 3. Correspondances directes par convention
          const isDirectFlagMatch =
            (falseFlag === 'battery_inspected' && (stepId === 'step_battery_1' || stepId === 'step_battery_2')) ||
            (falseFlag === 'battery_installed' && stepId === 'step_battery_2') ||
            (falseFlag === 'supercar_configured' && (stepId === 'step_car_1' || stepId === 'step_car_2')) ||
            (falseFlag === 'supercar_started' && (stepId === 'step_car_2' || stepId === 'step_car_3')) ||
            (falseFlag === 'laptop_capacity_verified' && stepId === 'step_insert_laptop');

          if (isFlagProducer || isFlagRequired || isDirectFlagMatch) {
            if (step.completed) {
              step.completed = false;
              invalidatedAny = true;
            }
            if (newState.flags) {
              delete newState.flags[`step_${step.id}_completed`];
            }
          }
        }

        if (invalidatedAny) {
          quest.status = 'in_progress';
          if (newState.flags) {
            delete newState.flags[`quest_${quest.id}_completed`];
          }
          const firstUnfinished = quest.steps.findIndex(s => !s.completed);
          quest.currentStepIndex = firstUnfinished === -1 ? 0 : firstUnfinished;
          const currentStep = quest.steps[quest.currentStepIndex];
          warnings.push(`↩️ Étape réactivée (${quest.currentStepIndex + 1}/${quest.steps.length}) : ${currentStep?.title || 'En cours'}`);
        }
      }

      if (quest.status === 'in_progress') {
        const newlyCompletedSteps: typeof quest.steps = [];

      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        if (step.completed) continue;

        // Dans une quête séquentielle, les étapes précédentes doivent être complétées avant de valider l'étape suivante
        const hasUnfinishedPreviousSteps = quest.steps.slice(0, i).some(s => !s.completed);
        if (hasUnfinishedPreviousSteps) continue;

        let stepMatch = false;

        // Parse optional colon-separated syntax e.g. 'DROP:go_stone_black_1:goban_table' or 'INTERACT:go_pass_btn'
        let reqType = step.requiredEvent;
        let reqSource = step.targetEntityId;
        let reqTarget = step.targetZoneId;
        if (step.requiredEvent && step.requiredEvent.includes(':')) {
          const parts = step.requiredEvent.split(':').map(p => p.trim()).filter(Boolean);
          reqType = parts[0];
          if (parts.length === 2) {
            reqSource = reqSource || parts[1];
          } else if (parts.length >= 3) {
            // Pour DROP:source:target, parts[1] est explicitement l'objet source et parts[2] la zone cible
            reqSource = parts[1] || reqSource;
            reqTarget = parts[2] || reqTarget;
          }
        }

        // Check event type match
        const typeMatches = event.type === reqType ||
          event.type === step.requiredEvent ||
          ((reqType === 'INTERACT' || reqType === 'INTERACTION' || reqType === 'CLICK' || reqType === 'INSPECT') && (
            event.type === 'INSPECT' || 
            event.type === 'INTERACT' ||
            event.type === 'INTERACTION' ||
            event.type === 'CLICK'
          ));

        if (typeMatches) {
          let sourceMatch = true;
          let targetMatch = true;

          const matchesEntityRef = (actualId: string | undefined, expectedRef: string | undefined) => {
            if (!expectedRef) return true;
            if (!actualId) return false;
            if (actualId === expectedRef) return true;
            if (expectedRef.startsWith('go_stone_black') && actualId.startsWith('go_stone_black')) return true;
            if (expectedRef.startsWith('go_stone_white') && actualId.startsWith('go_stone_white')) return true;

            const normAct = actualId.toLowerCase();
            const normExp = expectedRef.toLowerCase();
            if (normExp && (normAct.includes(normExp) || normExp.includes(normAct))) return true;

            if ((normAct.includes('configur') || normAct.includes('terminal') || normAct.includes('borne') || normAct.includes('console') || normAct.includes('holograph')) &&
                (normExp.includes('configur') || normExp.includes('terminal') || normExp.includes('borne') || normExp.includes('console') || normExp.includes('holograph'))) {
              return true;
            }
            if ((normAct.includes('start') || normAct.includes('moteur') || normAct.includes('key') || normAct.includes('cle') || normAct.includes('clé')) &&
                (normExp.includes('start') || normExp.includes('moteur') || normExp.includes('key') || normExp.includes('cle') || normExp.includes('clé'))) {
              return true;
            }
            if ((normAct.includes('auth') || normAct.includes('cockpit') || normAct.includes('dock') || normAct.includes('recepteur') || normAct.includes('récepteur') || normAct.includes('zone')) &&
                (normExp.includes('auth') || normExp.includes('cockpit') || normExp.includes('dock') || normExp.includes('recepteur') || normExp.includes('récepteur') || normExp.includes('zone'))) {
              return true;
            }
            if ((normAct.includes('supercar') || normAct.includes('voiture')) &&
                (normExp.includes('supercar') || normExp.includes('voiture'))) {
              return true;
            }
            if (normExp === 'goban_table' && normAct.includes('goban')) return true;

            const ent = newState.ir.entities[actualId];
            if (ent) {
              const entName = (ent.name || '').toLowerCase();
              const assetId = (ent.visuals?.assetId || '').toLowerCase();
              if (normExp && (entName.includes(normExp) || assetId.includes(normExp))) return true;
              if ((normExp.includes('configur') || normExp.includes('console') || normExp.includes('teinte')) &&
                  (entName.includes('configur') || entName.includes('console') || entName.includes('holograph') || entName.includes('teinte') || assetId.includes('configur'))) {
                return true;
              }
              if ((normExp.includes('start') || normExp.includes('moteur') || normExp.includes('bouton') || normExp.includes('cle') || normExp.includes('clé')) &&
                  (entName.includes('start') || entName.includes('moteur') || entName.includes('bouton') || entName.includes('clé') || entName.includes('cle'))) {
                return true;
              }
              if ((normExp.includes('auth') || normExp.includes('cockpit') || normExp.includes('dock') || normExp.includes('zone')) &&
                  (entName.includes('auth') || entName.includes('cockpit') || entName.includes('dock') || entName.includes('récepteur') || entName.includes('recepteur') || ent.capabilities.some(c => c.type === 'trigger_zone'))) {
                return true;
              }
              if ((normExp.includes('supercar') || normExp.includes('piste') || normExp.includes('voiture')) &&
                  (entName.includes('supercar') || entName.includes('voiture') || assetId.includes('supercar'))) {
                return true;
              }
            }

            return false;
          };

          if (reqType === 'DROP' && reqSource && reqTarget) {
            if (reqSource === reqTarget) {
              sourceMatch = matchesEntityRef(event.sourceId, reqSource) || matchesEntityRef(event.targetId, reqTarget);
              targetMatch = true;
            } else {
              const directMatch = matchesEntityRef(event.sourceId, reqSource) && matchesEntityRef(event.targetId, reqTarget);
              const swappedMatch = matchesEntityRef(event.sourceId, reqTarget) && matchesEntityRef(event.targetId, reqSource);
              sourceMatch = directMatch || swappedMatch;
              targetMatch = directMatch || swappedMatch;
            }
          } else {
            if (reqSource) {
              sourceMatch = matchesEntityRef(event.sourceId, reqSource) || matchesEntityRef(event.targetId, reqSource);
            }
            if (reqTarget) {
              targetMatch = matchesEntityRef(event.targetId, reqTarget) || matchesEntityRef(event.sourceId, reqTarget);
            }
          }

          if (sourceMatch && targetMatch) {
            stepMatch = true;
          }
        }

        // Also check if any step is linked to a flag that just became true
        if (!stepMatch && newState.flags) {
          const sTitleLow = (step.title || '').toLowerCase();
          const sDescLow = (step.description || '').toLowerCase();
          const questDomainId = (quest.id || '').replace(/^quest_/, '');
          if (newState.flags[`step_${step.id}_completed`]) stepMatch = true;
          if (
            (step.id === `${questDomainId}_step_1` || step.id.endsWith('_1_dialogue') || step.id.endsWith('_1_brief')) &&
            (newState.flags[`${questDomainId}_dialogue_read`] ||
              newState.flags[`${questDomainId}_audio_listened`] ||
              newState.flags[`${questDomainId}_brief_read`] ||
              newState.flags[`recipe_${questDomainId}_audio_listened`])
          ) {
            stepMatch = true;
          }
          if (
            (step.id === `${questDomainId}_step_2` || step.id.endsWith('_2_vocab') || step.id.endsWith('_2_setup')) &&
            (newState.flags[`recipe_${questDomainId}_prepped`] ||
              newState.flags[`${questDomainId}_vocab_discovered`] ||
              newState.flags[`${questDomainId}_prop_ready`])
          ) {
            stepMatch = true;
          }
          if (step.id === `${questDomainId}_step_3` && newState.flags[`recipe_${questDomainId}_cooked`]) {
            stepMatch = true;
          }
          if (step.id === 'step_lv_1' && newState.flags['monogram_inspected']) stepMatch = true;
          if (step.id === 'step_lv_2' && newState.flags['capucines_inspected']) stepMatch = true;
          if (step.id === 'step_lv_3' && newState.flags['bag_presented_podium']) stepMatch = true;
          if (step.id === 'step_battery_1' && newState.flags['battery_inspected']) stepMatch = true;
          if (step.id === 'step_battery_2' && newState.flags['battery_installed']) stepMatch = true;
          if (step.id === 'step_consult_guide' && newState.flags['guide_consulted']) stepMatch = true;
          if (step.id === 'step_harvest_cepe' && newState.flags['cepe_harvested']) stepMatch = true;
          if (step.id === 'step_identify_toxic_amanita' && newState.flags['amanita_identified']) stepMatch = true;
          if (step.id === 'step_insert_laptop' && newState.flags['laptop_capacity_verified']) stepMatch = true;
          if (step.id === 'step_attach_bottle' && newState.flags['bottle_attached']) stepMatch = true;
          if ((step.id === 'step_car_1' || step.id.includes('configur') || sTitleLow.includes('configur') || sTitleLow.includes('finition') || sTitleLow.includes('teinte') || sDescLow.includes('console holographique')) && newState.flags['supercar_configured']) {
            stepMatch = true;
          }
          if ((step.id === 'step_car_2' || step.id.includes('start') || sTitleLow.includes('clé') || sTitleLow.includes('cle') || sTitleLow.includes('moteur') || sTitleLow.includes('authentif')) && newState.flags['supercar_started']) {
            stepMatch = true;
          }
          if ((step.id === 'step_car_3' || sTitleLow.includes('piste') || sTitleLow.includes('essai') || sTitleLow.includes('simulation')) && newState.flags['supercar_track_sim']) {
            stepMatch = true;
          }
          if (!stepMatch && event.type === 'FLAG_CHANGED' && event.payload?.value === true && typeof event.payload?.flag === 'string') {
            const changedFlag = event.payload.flag;
            const rulesList = Object.values(newState.ir.rules || {});
            const linkedRule = rulesList.find(r => {
              if (!Array.isArray(r.actions) || !r.actions.some(a => a.type === 'set_flag' && a.flag === changedFlag && a.value !== false)) {
                return false;
              }
              // Doit concorder avec le type de déclencheur de l'étape
              if (reqType && r.trigger && r.trigger !== reqType && !(reqType === 'INTERACT' && r.trigger === 'CLICK')) {
                return false;
              }
              // Si l'étape a une zone cible (ex: battery_tray_zone), la règle doit la cibler
              if (reqTarget) {
                const targetsTarget = Array.isArray(r.conditions) && r.conditions.some(c => c.type === 'is_target' && (c.targetId === reqTarget || c.targetId === step.targetZoneId));
                if (!targetsTarget) return false;
              }
              // Si l'étape a une entité source, la règle doit correspondre à cette entité
              if (reqSource) {
                const matchesSource = Array.isArray(r.conditions) && r.conditions.some(c => c.type === 'is_source' && (c.sourceId === reqSource || c.sourceId === step.targetEntityId));
                if (!matchesSource) return false;
              }
              return true;
            });
            if (linkedRule) {
              stepMatch = true;
            }
          }
        }

        if (stepMatch) {
          step.completed = true;
          if (!newState.flags) newState.flags = {};
          const stepFlagKey = step.id.startsWith('step_') ? `${step.id}_completed` : `step_${step.id}_completed`;
          newState.flags[stepFlagKey] = true;
          // Alias de rétrocompatibilité sans duplication
          if (stepFlagKey !== `step_${step.id}_completed`) {
            newState.flags[`step_${step.id}_completed`] = true;
          }
          const stepTitleLow = (step.title || '').toLowerCase();
          const stepDescLow = (step.description || '').toLowerCase();
          if (step.id === 'step_car_1' || stepTitleLow.includes('configur') || stepTitleLow.includes('finition') || stepTitleLow.includes('teinte') || stepDescLow.includes('configur') || stepDescLow.includes('teinte') || stepDescLow.includes('console holographique')) {
            newState.flags['supercar_configured'] = true;
          }
          if (step.id === 'step_car_2' || stepTitleLow.includes('clé') || stepTitleLow.includes('cle') || stepTitleLow.includes('moteur') || stepTitleLow.includes('start') || stepTitleLow.includes('authentif') || stepDescLow.includes('start-stop') || stepDescLow.includes('authentif')) {
            newState.flags['supercar_started'] = true;
            newState.flags['ignition_active'] = true;
          }
          if (step.id === 'step_car_3' || stepTitleLow.includes('piste') || stepTitleLow.includes('essai') || stepDescLow.includes('piste')) {
            newState.flags['supercar_started'] = true;
            newState.flags['supercar_track_sim'] = true;
          }
          newlyCompletedSteps.push(step);
          break; // Un seul événement ne doit pas valider plusieurs étapes séquentielles en cascade
        }
      }

      if (newlyCompletedSteps.length > 0) {
        // Update currentStepIndex to point to the first uncompleted step
        const firstUnfinishedIndex = quest.steps.findIndex(s => !s.completed);
        quest.currentStepIndex = firstUnfinishedIndex === -1 ? quest.steps.length : firstUnfinishedIndex;

        const totalCompleted = quest.steps.filter(s => s.completed).length;

        if (totalCompleted >= quest.steps.length) {
          quest.status = 'completed';
          newState.flags[`quest_${quest.id}_completed`] = true;
          playAudioFx(quest.rewardSound || 'fanfare');
          warnings.push(`🎉 Quête accomplie : ${quest.title} !`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_quest_completed', { detail: { quest } }));
          }
        } else {
          playAudioFx('ping');
          const lastStep = newlyCompletedSteps[newlyCompletedSteps.length - 1];
          warnings.push(`✓ Étape validée (${totalCompleted}/${quest.steps.length}) : ${lastStep.title}`);
          const nextStep = quest.steps[quest.currentStepIndex];
          if (nextStep) {
            warnings.push(`🎯 Prochaine étape : ${nextStep.title}`);
          }
        }
      }
    }
  }
}

  // Increment version if state was modified
  newState.version += 1;
  
  return { newState, warnings, matchedRulesCount };
}
