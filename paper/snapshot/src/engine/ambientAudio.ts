/**
 * Procedural Continuous Ambient Audio Soundscapes Engine (Web Audio API)
 * Zero external audio assets required.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentAtmosphere: string = 'atelier';
  private isEnabled: boolean = false;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private crackleTimer: any = null;
  private chimeTimer: any = null;
  private masterVolume: number = 0.8;
  private isMuted: boolean = false;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private currentAcousticSpace: string = 'medium_hall';

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        const effectiveGain = this.isMuted ? 0 : this.masterVolume * 0.22;
        this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Procedural Reverb Convolver & Reverb Send Bus
        try {
          if (this.ctx.createConvolver) {
            this.reverbConvolver = this.ctx.createConvolver();
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
            const impulseBuf = this.buildProceduralImpulseResponse(0.75, 3.2);
            if (impulseBuf) {
              this.reverbConvolver.buffer = impulseBuf;
            }
            this.reverbConvolver.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);
          }
        } catch (_) {}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateGain();
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateGain();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateGain();
    return this.isMuted;
  }

  public getEffectiveVolume(): number {
    return this.isMuted ? 0 : this.masterVolume;
  }

  private updateGain(): void {
    if (this.masterGain && this.ctx) {
      const effectiveGain = this.isMuted ? 0 : this.masterVolume * 0.22;
      this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    this.initContext();
    return this.masterGain;
  }

  public isAudioActive(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    if (this.isEnabled) {
      this.stop();
      return false;
    } else {
      this.start(this.currentAtmosphere);
      return true;
    }
  }

  public buildProceduralImpulseResponse(durationSec: number, decayRate: number): AudioBuffer | null {
    if (!this.ctx || !this.ctx.createBuffer) return null;
    try {
      const sampleRate = this.ctx.sampleRate || 44100;
      const length = Math.floor(sampleRate * Math.max(0.1, durationSec));
      const impulse = this.ctx.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      // Early discrete reflections simulating immediate surface bounces
      const earlyReflections = [
        { sample: Math.floor(sampleRate * 0.012), gainL: 0.6, gainR: 0.3 },
        { sample: Math.floor(sampleRate * 0.024), gainL: 0.35, gainR: 0.55 },
        { sample: Math.floor(sampleRate * 0.045), gainL: 0.4, gainR: 0.4 },
      ];

      for (const ref of earlyReflections) {
        if (ref.sample < length) {
          left[ref.sample] += ref.gainL;
          right[ref.sample] += ref.gainR;
        }
      }

      // Late diffuse reverberation with exponential decay
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-decayRate * t);
        left[i] += (Math.random() * 2 - 1) * envelope * 0.35;
        right[i] += (Math.random() * 2 - 1) * envelope * 0.35;
      }

      return impulse;
    } catch (_) {
      return null;
    }
  }

  public getReverbNode(): ConvolverNode | null {
    this.initContext();
    return this.reverbConvolver;
  }

  public setAcousticSpace(space: 'wood_cabin' | 'medium_hall' | 'luxury_showroom' | 'metallic_lab' | 'kitchen') {
    this.initContext();
    this.currentAcousticSpace = space;
    if (!this.ctx || !this.reverbConvolver) return;
    let duration = 0.75;
    let decay = 3.2;
    let sendLevel = 0.24;

    switch (space) {
      case 'wood_cabin':
        duration = 0.35;
        decay = 6.0;
        sendLevel = 0.14;
        break;
      case 'luxury_showroom':
        duration = 1.35;
        decay = 2.2;
        sendLevel = 0.32;
        break;
      case 'metallic_lab':
        duration = 1.6;
        decay = 1.8;
        sendLevel = 0.36;
        break;
      case 'kitchen':
        duration = 0.5;
        decay = 4.5;
        sendLevel = 0.26;
        break;
      case 'medium_hall':
      default:
        duration = 0.75;
        decay = 3.2;
        sendLevel = 0.24;
        break;
    }

    try {
      const buf = this.buildProceduralImpulseResponse(duration, decay);
      if (buf) {
        this.reverbConvolver.buffer = buf;
      }
      if (this.reverbGain) {
        this.reverbGain.gain.setValueAtTime(sendLevel, this.ctx.currentTime);
      }
    } catch (_) {}
  }

  public getAcousticSpace(): string {
    return this.currentAcousticSpace;
  }

  public updateListener(
    posX: number, posY: number, posZ: number,
    forwardX: number, forwardY: number, forwardZ: number,
    upX: number, upY: number, upZ: number
  ): void {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    if (!listener) return;
    const now = this.ctx.currentTime;

    try {
      if (listener.positionX && listener.positionX.setValueAtTime) {
        listener.positionX.setValueAtTime(posX, now);
        listener.positionY.setValueAtTime(posY, now);
        listener.positionZ.setValueAtTime(posZ, now);
        listener.forwardX.setValueAtTime(forwardX, now);
        listener.forwardY.setValueAtTime(forwardY, now);
        listener.forwardZ.setValueAtTime(forwardZ, now);
        listener.upX.setValueAtTime(upX, now);
        listener.upY.setValueAtTime(upY, now);
        listener.upZ.setValueAtTime(upZ, now);
      } else if ((listener as any).setPosition) {
        (listener as any).setPosition(posX, posY, posZ);
        (listener as any).setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
      }
    } catch (_) {}
  }

  public setAtmosphere(atmoId: string) {
    this.currentAtmosphere = atmoId;
    const id = (atmoId || '').toLowerCase();
    if (id.includes('refuge') || id.includes('alpin')) {
      this.setAcousticSpace('wood_cabin');
    } else if (id.includes('luxe') || id.includes('showroom') || id.includes('supercar') || id.includes('penthouse')) {
      this.setAcousticSpace('luxury_showroom');
    } else if (id.includes('station') || id.includes('spatial') || id.includes('lunar') || id.includes('zero_g')) {
      this.setAcousticSpace('metallic_lab');
    } else if (id.includes('bistrot') || id.includes('cuisine') || id.includes('ratatouille')) {
      this.setAcousticSpace('kitchen');
    } else {
      this.setAcousticSpace('medium_hall');
    }

    if (this.isEnabled) {
      this.stopNodes();
      this.playAtmosphere(atmoId);
    }
  }

  public start(atmoId?: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    this.isEnabled = true;
    if (atmoId) this.currentAtmosphere = atmoId;
    this.stopNodes();
    this.playAtmosphere(this.currentAtmosphere);
  }

  public stop() {
    this.isEnabled = false;
    this.stopNodes();
  }

  private stopNodes() {
    if (this.crackleTimer) {
      clearInterval(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.chimeTimer) {
      clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
  }

  private playAtmosphere(atmoId: string) {
    if (!this.ctx || !this.masterGain) return;

    switch (atmoId) {
      case 'le-refuge':
      case 'refuge-alpin':
      case 'refuge_binaural':
        this.playRefugeSoundscape();
        break;
      case 'paris-rain':
        this.playRainSoundscape();
        break;
      case 'cozy-bistrot':
        this.playBistrotSoundscape();
        break;
      case 'starry-night':
        this.playFireplaceSoundscape();
        break;
      case 'zen-garden':
        this.playZenSoundscape();
        break;
      case 'martian-surface':
        this.playMartianWind();
        break;
      case 'orbital-zerog':
        this.playSpaceStationHiss();
        break;
      case 'lunar-base':
        this.playLunarSilence();
        break;
      case 'antigravity-anomaly':
        this.playAntigravityDrone();
        break;
      case 'cyberpunk-matrix':
      case 'cyberpunk-neon':
        this.playCyberpunkSoundscape();
        break;
      case 'golden-morning':
        this.playMorningBreeze();
        break;
      case 'celebration-party':
        this.playCelebrationAmbiance();
        break;
      case 'forest-clearing':
        this.playForestBirdsSoundscape();
        break;
      case 'coastal-beach':
      case 'ocean_waves':
      case 'plage':
        this.playOceanWavesSoundscape();
        break;
      case 'earth-atelier':
      case 'atelier':
      default:
        this.playSubtleRoomAmbiance();
        break;
    }
  }

  // 1. Pluie fine parisienne : bruit rose filtré passe-bande et gouttes occasionnelles
  private playRainSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.12;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.activeNodes.push({ stop: () => noise.stop(), disconnect: () => gain.disconnect() });
  }

  // 2. Bistrot chaleureux : chaleur basse fréquence, rumeur feutrée et cliquetis de porcelaine
  private playBistrotSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(82, this.ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });

    // Subtle culinary porcelain resonance
    this.chimeTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const bell = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bell.type = 'sine';
      const f = [1280, 1420, 1680, 1920][Math.floor(Math.random() * 4)];
      bell.frequency.setValueAtTime(f, now);
      bGain.gain.setValueAtTime(0.012 + Math.random() * 0.012, now);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      bell.connect(bGain);
      bGain.connect(this.masterGain);
      bell.start(now);
      bell.stop(now + 0.16);
    }, 4200);
  }

  // 3. Feu de cheminée & Nuit : crépitements doux et réguliers
  private playFireplaceSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    this.crackleTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 800, now);
      gain.gain.setValueAtTime(0.04 + Math.random() * 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
    }, 180);
  }

  // 3b. Le Refuge Alpin : crépitement de feu de camp, brise montagnarde et onde de lac
  private playRefugeSoundscape() {
    if (!this.ctx || !this.masterGain) return;

    // A. Brise montagnarde (bruit rose filtré passe-bas avec LFO doux)
    const bufferSize = this.ctx.sampleRate * 2.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(340, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSource.start();

    this.activeNodes.push({
      stop: () => windSource.stop(),
      disconnect: () => {
        windSource.disconnect();
        windFilter.disconnect();
        windGain.disconnect();
      }
    });

    // B. Crépitements de feu de bois (micro-pops irréguliers)
    this.crackleTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = Math.random() > 0.4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 1200, now);
      gain.gain.setValueAtTime(0.05 + Math.random() * 0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03 + Math.random() * 0.02);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }, 140);
  }

  // 4. Jardin Zen : souffle léger et tintement cristallin périodique
  private playZenSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, this.ctx.currentTime); // G3
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });

    // Periodic gentle singing bowl tone
    this.chimeTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(587.33, now); // D5
      chimeGain.gain.setValueAtTime(0.05, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      chime.connect(chimeGain);
      chimeGain.connect(this.masterGain);
      chime.start(now);
      chime.stop(now + 2.5);
    }, 4500);
  }

  // 5. Cyberpunk Néon : onde basse synthétique et grondement sub-bass
  private playCyberpunkSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });
  }

  // 6. Matin doré : souffle d'air pur
  private playMorningBreeze() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });
  }

  // 7. Fête & Célébration
  private playCelebrationAmbiance() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });
  }

  // 8. Atelier doux neutre
  private playSubtleRoomAmbiance() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });
  }

  // 9. Balayage métamorphique de World-Shift (Transition sonore procédurale)
  public playWorldShiftSweep() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Oscillateur à résonance descendante/ascendante
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.65);

    oscGain.gain.setValueAtTime(0.22, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);

    // Bruit blanc filtré pour souffle de transformation
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.65);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain || this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.7);
  }

  // 10. Vent Martien : bruit teinté filtré passe-bande à balayage lent
  private playMartianWind() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise approximation for heavy planetary atmosphere
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 1.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.activeNodes.push({ stop: () => noise.stop(), disconnect: () => gain.disconnect() });
  }

  // 11. Station Spatiale : bourdonnement sub-bass et dépressurisation d'airlock
  private playSpaceStationHiss() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(52, this.ctx.currentTime); // Low engine hum
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(95, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });

    // Periodic life support oxygen hiss
    this.chimeTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.9);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1600, now);
      f.Q.setValueAtTime(1.5, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      src.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      src.start(now);
      src.stop(now + 0.85);
    }, 7000);
  }

  // 12. Silence Lunaire : onde infra-basse feutrée et télémétrie lointaine
  private playLunarSilence() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(42, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.activeNodes.push({ stop: () => osc.stop(), disconnect: () => gain.disconnect() });

    // Telemetry ping
    this.chimeTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      const now = this.ctx.currentTime;
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1480, now);
      pingGain.gain.setValueAtTime(0.025, now);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      ping.connect(pingGain);
      pingGain.connect(this.masterGain);
      ping.start(now);
      ping.stop(now + 0.2);
    }, 6500);
  }

  // 13. Anomalie Antigravitationnelle : battement binaural et harmoniques célestes
  private playAntigravityDrone() {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(112.5, this.ctx.currentTime); // 2.5 Hz binaural pulse

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start();
    osc2.start();

    this.activeNodes.push({ stop: () => { osc1.stop(); osc2.stop(); }, disconnect: () => gain.disconnect() });
  }

  // 14. Clairière Forestière & Sous-Bois : Brise sylvestre douce et chants d'oiseaux périodiques
  private playForestBirdsSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    
    // Gentle wind rustle (lowpass filtered pink noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.055;
      b1 = 0.99332 * b1 + white * 0.075;
      b2 = 0.96900 * b2 + white * 0.15;
      data[i] = (b0 + b1 + b2) * 0.08;
    }

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = buffer;
    windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(650, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windNoise.start();

    // Occasional forest bird chirps (gentle sine wave frequency chirps)
    let isStopped = false;
    const triggerBirdSong = () => {
      if (isStopped || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const birdOsc = this.ctx.createOscillator();
      const birdGain = this.ctx.createGain();
      const baseFreq = 2200 + Math.random() * 800;

      birdOsc.type = 'sine';
      birdOsc.frequency.setValueAtTime(baseFreq, now);
      birdOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);
      birdOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.18);
      birdOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.28);

      birdGain.gain.setValueAtTime(0.001, now);
      birdGain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      birdGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      birdOsc.connect(birdGain);
      birdGain.connect(this.masterGain);
      birdOsc.start(now);
      birdOsc.stop(now + 0.35);

      const nextDelay = 3500 + Math.random() * 5000;
      setTimeout(triggerBirdSong, nextDelay);
    };

    setTimeout(triggerBirdSong, 1500);

    this.activeNodes.push({
      stop: () => {
        isStopped = true;
        windNoise.stop();
      },
      disconnect: () => {
        windGain.disconnect();
      }
    });
  }

  // 14. Ressac Océanique & Vagues Marines : modulation périodique passe-bas/passe-bande
  private playOceanWavesSoundscape() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Bruit rose/brun pour la masse d'eau
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
    }

    const oceanNoise = this.ctx.createBufferSource();
    oceanNoise.buffer = buffer;
    oceanNoise.loop = true;

    // Filtre passe-bas modulé
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    waveFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Gain principal de la vague
    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // LFO pour le ressac (cycle de houle ~ 6.5 secondes)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

    const lfoFilterMod = this.ctx.createGain();
    lfoFilterMod.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    lfo.connect(lfoFilterMod);
    lfoFilterMod.connect(waveFilter.frequency);

    oceanNoise.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(this.masterGain);

    oceanNoise.start();
    lfo.start();

    // 2. Chuchotement de l'écume en crête de vague
    const foamBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const foamData = foamBuffer.getChannelData(0);
    for (let i = 0; i < foamData.length; i++) {
      foamData[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const foamNoise = this.ctx.createBufferSource();
    foamNoise.buffer = foamBuffer;
    foamNoise.loop = true;

    const foamFilter = this.ctx.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    foamFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const foamGain = this.ctx.createGain();
    foamGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    lfo.connect(foamGain.gain);

    foamNoise.connect(foamFilter);
    foamFilter.connect(foamGain);
    foamGain.connect(this.masterGain);

    foamNoise.start();

    this.activeNodes.push({
      stop: () => {
        oceanNoise.stop();
        foamNoise.stop();
        lfo.stop();
      },
      disconnect: () => {
        waveGain.disconnect();
        foamGain.disconnect();
        lfoGain.disconnect();
        lfoFilterMod.disconnect();
      }
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
