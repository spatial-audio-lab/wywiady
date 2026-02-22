/**
 * AudioEngine - Spatial audio engine for Interactive Ambisonic Reportage
 * 
 * Uses Web Audio API with HRTF PannerNodes for spatial positioning.
 * In production, Omnitone FOA renderer would decode the ambient B-format files.
 * For this demo, we synthesize audio to demonstrate the spatial concepts.
 */

export interface SpeakerPosition {
  x: number;
  y: number;
  z: number;
}

export interface AudioEngineState {
  isPlaying: boolean;
  currentTrackIndex: number;
  listenerX: number;
  listenerZ: number;
  listenerAngle: number;
  speakerAPos: SpeakerPosition;
  speakerBPos: SpeakerPosition;
  ambientLevel: number;
  dialogLevel: number;
}

type StateCallback = (state: Partial<AudioEngineState>) => void;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private dialogGain: GainNode | null = null;
  private pannerA: PannerNode | null = null;
  private pannerB: PannerNode | null = null;
  // ambientSource reserved for real FOA file playback
  private dialogSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private currentTrackIndex = -1;
  private trackQueue: { speaker: 'A' | 'B'; durationMs: number; label: string }[] = [];
  private onStateChange: StateCallback;
  private trackTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private dialogOscillator: OscillatorNode | null = null;
  public currentInterviewId: string | null = null;

  // Positions
  private speakerAPos: SpeakerPosition = { x: -3, y: 0, z: -3 };
  private speakerBPos: SpeakerPosition = { x: 3, y: 0, z: -3 };
  private listenerX = 0;
  private listenerZ = 4;
  private listenerAngle = 0;

  // Gain staging
  private ambientLevelValue = 0.25;
  private dialogLevelValue = 0.7;

  constructor(onStateChange: StateCallback) {
    this.onStateChange = onStateChange;
  }

  async init(): Promise<void> {
    if (this.ctx) return;

    this.ctx = new AudioContext({ sampleRate: 48000 });

    // Master gain for clipping prevention
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    // Compressor for gain staging safety
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(this.masterGain);

    // Ambient bus
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.ambientLevelValue;
    this.ambientGain.connect(compressor);

    // Dialog bus
    this.dialogGain = this.ctx.createGain();
    this.dialogGain.gain.value = this.dialogLevelValue;
    this.dialogGain.connect(compressor);

    // PannerNode A (HRTF)
    this.pannerA = this.ctx.createPanner();
    this.pannerA.panningModel = 'HRTF';
    this.pannerA.distanceModel = 'inverse';
    this.pannerA.refDistance = 1;
    this.pannerA.maxDistance = 50;
    this.pannerA.rolloffFactor = 1.5;
    this.pannerA.coneInnerAngle = 360;
    this.pannerA.coneOuterAngle = 360;
    this.pannerA.setPosition(this.speakerAPos.x, this.speakerAPos.y, this.speakerAPos.z);
    this.pannerA.connect(this.dialogGain);

    // PannerNode B (HRTF)
    this.pannerB = this.ctx.createPanner();
    this.pannerB.panningModel = 'HRTF';
    this.pannerB.distanceModel = 'inverse';
    this.pannerB.refDistance = 1;
    this.pannerB.maxDistance = 50;
    this.pannerB.rolloffFactor = 1.5;
    this.pannerB.coneInnerAngle = 360;
    this.pannerB.coneOuterAngle = 360;
    this.pannerB.setPosition(this.speakerBPos.x, this.speakerBPos.y, this.speakerBPos.z);
    this.pannerB.connect(this.dialogGain);

    // Set initial listener position
    this.updateListenerPosition(this.listenerX, this.listenerZ, this.listenerAngle);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  updateListenerPosition(x: number, z: number, angle: number): void {
    this.listenerX = x;
    this.listenerZ = z;
    this.listenerAngle = angle;

    if (!this.ctx) return;

    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = x;
      listener.positionY.value = 1.7; // Ear height
      listener.positionZ.value = z;

      const fx = Math.sin(angle);
      const fz = -Math.cos(angle);
      listener.forwardX.value = fx;
      listener.forwardY.value = 0;
      listener.forwardZ.value = fz;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      listener.setPosition(x, 1.7, z);
      const fx = Math.sin(angle);
      const fz = -Math.cos(angle);
      listener.setOrientation(fx, 0, fz, 0, 1, 0);
    }

    this.onStateChange({
      listenerX: x,
      listenerZ: z,
      listenerAngle: angle,
    });
  }

  setSpeakerPositions(a: SpeakerPosition, b: SpeakerPosition): void {
    this.speakerAPos = a;
    this.speakerBPos = b;
    if (this.pannerA) {
      this.pannerA.setPosition(a.x, a.y, a.z);
    }
    if (this.pannerB) {
      this.pannerB.setPosition(b.x, b.y, b.z);
    }
    this.onStateChange({
      speakerAPos: a,
      speakerBPos: b,
    });
  }

  private createNoiseBuffer(durationSec: number, color: 'white' | 'pink' | 'brown' = 'brown'): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        data[i] = white * 0.2;
      } else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        b0 = (b0 + (0.02 * white)) / 1.02;
        data[i] = b0 * 3.5;
      }
    }
    return buffer;
  }

  private createToneBuffer(freq: number, durationSec: number): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Simulate speech-like modulation
    const fundamentalFreq = freq;
    const formant1 = freq * 3.2;
    const formant2 = freq * 5.5;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Amplitude modulation (syllable-like envelope ~4Hz)
      const ampMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3.5 * t + Math.sin(2 * Math.PI * 0.7 * t) * 2);
      // Pitch variation
      const pitchMod = 1 + 0.05 * Math.sin(2 * Math.PI * 1.3 * t);
      // Fundamental + formants
      const fundamental = Math.sin(2 * Math.PI * fundamentalFreq * pitchMod * t) * 0.4;
      const f1 = Math.sin(2 * Math.PI * formant1 * pitchMod * t) * 0.2;
      const f2 = Math.sin(2 * Math.PI * formant2 * pitchMod * t) * 0.1;
      // Add some noise (breath)
      const breath = (Math.random() * 2 - 1) * 0.08;

      // Fade in/out
      const fadeIn = Math.min(1, t / 0.3);
      const fadeOut = Math.min(1, (durationSec - t) / 0.5);
      const envelope = fadeIn * fadeOut;

      data[i] = (fundamental + f1 + f2 + breath) * ampMod * envelope * 0.5;
    }
    return buffer;
  }

  private startAmbient(interviewIndex: number): void {
    if (!this.ctx || !this.ambientGain) return;

    this.stopAmbient();

    // Create ambient soundscape based on interview theme
    const frequencies = [
      [60, 120, 180, 440],  // Urban
      [220, 330, 880, 1200], // Forest
      [80, 160, 300, 500],   // Harbor
      [100, 200, 400, 600],  // Metro
      [130, 260, 520, 780],  // Cathedral
    ];

    const freqs = frequencies[interviewIndex % frequencies.length];

    // Brown noise for ambience base
    const noiseBuffer = this.createNoiseBuffer(10, 'brown');
    this.ambientNoiseSource = this.ctx.createBufferSource();
    this.ambientNoiseSource.buffer = noiseBuffer;
    this.ambientNoiseSource.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.3;
    this.ambientNoiseSource.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    this.ambientNoiseSource.start();

    // Tonal drones
    freqs.forEach((freq) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 0.02;

      // Slow LFO for movement
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.1 + Math.random() * 0.3;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.01;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(this.ambientGain);
      osc.start();
      this.ambientOscillators.push(osc, lfo);
    });
  }

  private stopAmbient(): void {
    this.ambientOscillators.forEach(osc => {
      try { osc.stop(); } catch { /* */ }
    });
    this.ambientOscillators = [];
    if (this.ambientNoiseSource) {
      try { this.ambientNoiseSource.stop(); } catch { /* */ }
      this.ambientNoiseSource = null;
    }
  }

  private playTrack(index: number): void {
    if (!this.ctx || index >= this.trackQueue.length) {
      this.isPlaying = false;
      this.currentTrackIndex = -1;
      this.onStateChange({ isPlaying: false, currentTrackIndex: -1 });
      return;
    }

    this.stopCurrentDialog();
    this.currentTrackIndex = index;

    const track = this.trackQueue[index];
    const panner = track.speaker === 'A' ? this.pannerA : this.pannerB;

    if (!panner) return;

    // Create speech-like tone for demo
    const baseFreq = track.speaker === 'A' ? 150 : 110; // A is higher voice, B is lower
    const durationSec = track.durationMs / 1000;
    const buffer = this.createToneBuffer(baseFreq, durationSec);

    this.dialogSource = this.ctx.createBufferSource();
    this.dialogSource.buffer = buffer;
    this.dialogSource.connect(panner);
    this.dialogSource.start();

    this.onStateChange({
      isPlaying: true,
      currentTrackIndex: index,
    });

    // Queue next track
    this.trackTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.playTrack(index + 1);
      }
    }, track.durationMs);
  }

  private stopCurrentDialog(): void {
    if (this.trackTimer) {
      clearTimeout(this.trackTimer);
      this.trackTimer = null;
    }
    if (this.dialogSource) {
      try { this.dialogSource.stop(); } catch { /* */ }
      this.dialogSource = null;
    }
    if (this.dialogOscillator) {
      try { this.dialogOscillator.stop(); } catch { /* */ }
      this.dialogOscillator = null;
    }
  }

  async loadInterview(interviewId: string, tracks: { speaker: 'A' | 'B'; durationMs: number; label: string }[], interviewIndex: number): Promise<void> {
    await this.init();

    // Stop everything
    this.stop();

    this.currentInterviewId = interviewId;
    this.trackQueue = tracks;
    this.currentTrackIndex = -1;

    // Reset listener position
    this.updateListenerPosition(0, 4, 0);

    // Start ambient bed
    this.startAmbient(interviewIndex);

    this.onStateChange({
      isPlaying: false,
      currentTrackIndex: -1,
    });
  }

  play(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    if (this.currentTrackIndex < 0) {
      this.playTrack(0);
    } else {
      this.playTrack(this.currentTrackIndex);
    }
  }

  pause(): void {
    this.isPlaying = false;
    this.stopCurrentDialog();
    this.onStateChange({ isPlaying: false });
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTrackIndex = -1;
    this.stopCurrentDialog();
    this.stopAmbient();
    this.onStateChange({ isPlaying: false, currentTrackIndex: -1 });
  }

  skipTo(index: number): void {
    if (index < 0 || index >= this.trackQueue.length) return;
    this.isPlaying = true;
    this.playTrack(index);
  }

  skipNext(): void {
    if (this.currentTrackIndex < this.trackQueue.length - 1) {
      this.skipTo(this.currentTrackIndex + 1);
    }
  }

  skipPrev(): void {
    if (this.currentTrackIndex > 0) {
      this.skipTo(this.currentTrackIndex - 1);
    }
  }

  setAmbientLevel(val: number): void {
    this.ambientLevelValue = val;
    if (this.ambientGain) {
      this.ambientGain.gain.value = val;
    }
    this.onStateChange({ ambientLevel: val });
  }

  setDialogLevel(val: number): void {
    this.dialogLevelValue = val;
    if (this.dialogGain) {
      this.dialogGain.gain.value = val;
    }
    this.onStateChange({ dialogLevel: val });
  }

  getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTrackIndex: this.currentTrackIndex,
      listenerX: this.listenerX,
      listenerZ: this.listenerZ,
      listenerAngle: this.listenerAngle,
      speakerAPos: this.speakerAPos,
      speakerBPos: this.speakerBPos,
      ambientLevel: this.ambientLevelValue,
      dialogLevel: this.dialogLevelValue,
    };
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
