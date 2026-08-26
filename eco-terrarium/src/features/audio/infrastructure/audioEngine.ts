import { EnvironmentState, EcosystemStats } from '../../../shared/kernel/types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.6;
  private isInitialized: boolean = false;

  // Ambient Pad Nodes
  private padGain: GainNode | null = null;
  private padOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private padFilter: BiquadFilterNode | null = null;

  // Foley Nodes
  private rainGain: GainNode | null = null;
  private sunShimmerGain: GainNode | null = null;
  private sunOsc: OscillatorNode | null = null;

  // Pentatonic Scale (Hz): C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
  private pentatonicScale: number[] = [
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
  ];

  // Chord Progression Definitions
  private chords = [
    [261.63, 329.63, 392.00, 523.25], // C Major
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [174.61, 220.00, 261.63, 329.63], // F Major 7
    [196.00, 246.94, 293.66, 392.00], // G Major
  ];
  private currentChordIndex: number = 0;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupAmbientPad();
      this.setupProceduralFoley();
      this.startChordProgression();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private setupAmbientPad() {
    if (!this.ctx || !this.masterGain) return;

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.padFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.padGain.connect(this.padFilter);
    this.padFilter.connect(this.masterGain);

    // Create 4 gentle sine/triangle pad voices
    const chord = this.chords[0];
    this.padOscs = chord.map((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.25, this.ctx!.currentTime);

      osc.connect(gain);
      gain.connect(this.padGain!);
      osc.start();
      return { osc, gain };
    });
  }

  private setupProceduralFoley() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Procedural Rain Noise (Filtered White/Pink Noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    rainFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    whiteNoise.start();

    // 2. Sunlight Shimmer Drone
    this.sunOsc = this.ctx.createOscillator();
    this.sunOsc.type = 'sine';
    this.sunOsc.frequency.setValueAtTime(880, this.ctx.currentTime);

    this.sunShimmerGain = this.ctx.createGain();
    this.sunShimmerGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.sunOsc.connect(this.sunShimmerGain);
    this.sunShimmerGain.connect(this.masterGain);
    this.sunOsc.start();
  }

  private startChordProgression() {
    setInterval(() => {
      if (!this.ctx || this.padOscs.length === 0) return;
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      const targetChord = this.chords[this.currentChordIndex];

      const now = this.ctx.currentTime;
      targetChord.forEach((freq, idx) => {
        if (this.padOscs[idx]) {
          this.padOscs[idx].osc.frequency.setTargetAtTime(freq, now, 2.5);
        }
      });
    }, 6000);
  }

  /**
   * Modulates sound based on Environmental Parameters & Ecosystem Stats
   */
  public updateState(env: EnvironmentState, stats: EcosystemStats) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Modulate Rain Foley
    if (this.rainGain) {
      const rainVol = (env.moisture / 100) * 0.12;
      this.rainGain.gain.setTargetAtTime(rainVol, now, 0.4);
    }

    // Modulate Sun Shimmer
    if (this.sunShimmerGain && this.sunOsc) {
      const sunVol = (env.sunlight / 100) * 0.05;
      this.sunShimmerGain.gain.setTargetAtTime(sunVol, now, 0.5);
      this.sunOsc.frequency.setTargetAtTime(520 + env.sunlight * 4, now, 0.5);
    }

    // Modulate Filter brightness based on health & biodiversity
    if (this.padFilter) {
      const cutoff = 300 + (stats.ecosystemHealth / 100) * 800 + stats.biodiversityIndex * 200;
      this.padFilter.frequency.setTargetAtTime(cutoff, now, 1.0);
    }
  }

  /**
   * Plays dynamic bio-rhythm sound effects
   */
  public playBioSound(type: 'eat' | 'reproduce' | 'evolve' | 'death' | 'tap' | 'drop', pitchShift?: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (type === 'eat') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const randomPitch = this.pentatonicScale[Math.floor(Math.random() * 6) + 3];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomPitch * (pitchShift || 1.0), now);
      osc.frequency.exponentialRampToValueAtTime(randomPitch * 1.5, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'reproduce') {
      // Ascending sweet dual chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'evolve') {
      // Magnificent 5-note harp cascade
      [392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.65);
      });
    } else if (type === 'tap') {
      // Glass clink ping (2200Hz + ring)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2150, now);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'drop') {
      // Water droplet resonant pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'death') {
      // Gentle harmonic bass tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
