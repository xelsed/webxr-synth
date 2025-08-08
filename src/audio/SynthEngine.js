import * as Tone from 'tone';
import { BeatGenerator } from './BeatGenerator.js';

export class SynthEngine {
  constructor() {
    this.isPlaying = false;
    this.bpm = 120;
    this.beatGenerator = new BeatGenerator();
    this.currentPattern = null;
    this.sequencers = [];
    this.effects = {};
    this.analyzer = null;
    this.isInitialized = false;
    
    // Don't auto-initialize to prevent audio overload
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Start with minimal setup
      this.setupMinimalSynths();
      this.setupMinimalEffects();
      this.setupAnalyzer();
      this.generateSimplePattern();
      this.isInitialized = true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw error;
    }
  }
  
  setupMinimalSynths() {
    // Only create essential synths
    this.leadSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      }
    });
    
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4
      }
    });
  }
  
  setupMinimalEffects() {
    // Minimal effects to prevent overload
    this.effects.limiter = new Tone.Limiter(-6);
    
    // Direct connections with no heavy effects
    this.leadSynth.connect(this.effects.limiter);
    this.kick.connect(this.effects.limiter);
    this.effects.limiter.toDestination();
  }
  
  setupAnalyzer() {
    this.analyzer = new Tone.Analyser('fft', 128); // Reduced from 256
    this.effects.limiter.connect(this.analyzer);
  }
  
  generateSimplePattern() {
    // Much simpler pattern
    this.currentPattern = {
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
    };
    
    this.clearSequencers();
    
    // Only one drum sequence
    const drumSeq = new Tone.Sequence((time, step) => {
      if (this.currentPattern.kick[step] === 1) {
        this.kick.triggerAttackRelease('C1', '8n', time);
      }
    }, [...Array(16).keys()], '16n');
    
    // Simple melody
    const melody = ['C4', null, 'E4', null, 'G4', null, 'E4', null];
    const melodySeq = new Tone.Sequence((time, step) => {
      const note = melody[step % melody.length];
      if (note) {
        this.leadSynth.triggerAttackRelease(note, '16n', time, 0.5);
      }
    }, [...Array(8).keys()], '16n');
    
    this.sequencers = [drumSeq, melodySeq];
  }
  
  clearSequencers() {
    this.sequencers.forEach(seq => {
      try {
        seq.stop();
        seq.dispose();
      } catch (e) {
        console.warn('Failed to clear sequencer:', e);
      }
    });
    this.sequencers = [];
  }
  
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    Tone.Transport.bpm.value = this.bpm;
    
    this.sequencers.forEach(seq => seq.start(0));
    Tone.Transport.start();
    
    this.isPlaying = true;
  }
  
  stop() {
    Tone.Transport.stop();
    this.sequencers.forEach(seq => {
      try {
        seq.stop();
      } catch (e) {
        console.warn('Failed to stop sequencer:', e);
      }
    });
    this.isPlaying = false;
  }
  
  setBPM(bpm) {
    this.bpm = Math.max(60, Math.min(200, bpm));
    if (Tone.Transport) {
      Tone.Transport.bpm.value = this.bpm;
    }
  }
  
  getFFTData() {
    if (!this.analyzer) return new Float32Array(128);
    try {
      return this.analyzer.getValue();
    } catch (e) {
      return new Float32Array(128);
    }
  }
  
  getWaveformData() {
    return new Float32Array(1024); // Return empty for now
  }
  
  dispose() {
    this.stop();
    this.clearSequencers();
    
    try {
      if (this.leadSynth) this.leadSynth.dispose();
      if (this.kick) this.kick.dispose();
      
      Object.values(this.effects).forEach(effect => {
        if (effect && effect.dispose) effect.dispose();
      });
      
      if (this.analyzer) this.analyzer.dispose();
    } catch (e) {
      console.warn('Disposal error:', e);
    }
  }
  
  // Stub methods for compatibility
  mutatePattern() {
    this.generateSimplePattern();
  }
  
  generateNewPattern() {
    this.generateSimplePattern();
  }
}