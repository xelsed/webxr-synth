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
    this.synthsCreated = false;
  }
  
  // Create synths only when needed
  createSynths() {
    if (this.synthsCreated) return;
    
    try {
      // Lead synth
      this.leadSynth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.8
        }
      });
      
      // Bass synth
      this.bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.8,
          release: 0.2
        }
      });
      
      // Simple drum
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
      
      // Create simple effects chain
      this.effects.gain = new Tone.Gain(0.5);
      this.effects.limiter = new Tone.Limiter(-3);
      
      // Connect everything
      this.leadSynth.connect(this.effects.gain);
      this.bassSynth.connect(this.effects.gain);
      this.kick.connect(this.effects.gain);
      this.effects.gain.connect(this.effects.limiter);
      this.effects.limiter.toDestination();
      
      // Create analyzer for visualization
      this.analyzer = new Tone.Analyser('fft', 128);
      this.effects.limiter.connect(this.analyzer);
      
      this.synthsCreated = true;
      console.log('Synths created successfully');
    } catch (error) {
      console.error('Failed to create synths:', error);
      throw error;
    }
  }
  
  generateSimplePattern() {
    this.clearSequencers();
    
    // Very simple pattern
    const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0];
    const melodyNotes = ['C4', null, 'E4', null, 'G4', null, 'E4', null];
    const bassNotes = ['C2', null, null, null, 'G2', null, null, null];
    
    // Kick drum
    const kickSeq = new Tone.Sequence((time, step) => {
      if (kickPattern[step] === 1) {
        this.kick.triggerAttackRelease('C1', '8n', time, 0.8);
      }
    }, [...Array(8).keys()], '8n');
    
    // Melody
    const melodySeq = new Tone.Sequence((time, step) => {
      const note = melodyNotes[step];
      if (note) {
        this.leadSynth.triggerAttackRelease(note, '8n', time, 0.5);
      }
    }, [...Array(8).keys()], '8n');
    
    // Bass
    const bassSeq = new Tone.Sequence((time, step) => {
      const note = bassNotes[step];
      if (note) {
        this.bassSynth.triggerAttackRelease(note, '4n', time, 0.6);
      }
    }, [...Array(8).keys()], '8n');
    
    this.sequencers = [kickSeq, melodySeq, bassSeq];
    this.currentPattern = { kick: kickPattern };
  }
  
  clearSequencers() {
    this.sequencers.forEach(seq => {
      try {
        seq.stop();
        seq.dispose();
      } catch (e) {
        // Ignore errors
      }
    });
    this.sequencers = [];
  }
  
  async start() {
    try {
      console.log('Starting audio engine...');
      
      // Start audio context first (requires user interaction)
      if (Tone.context.state !== 'running') {
        console.log('Starting Tone.js audio context...');
        await Tone.start();
        console.log('Audio context started');
      }
      
      // Create synths after audio context is running
      if (!this.synthsCreated) {
        this.createSynths();
      }
      
      // Generate pattern
      if (!this.currentPattern) {
        this.generateSimplePattern();
      }
      
      // Set BPM and start
      Tone.Transport.bpm.value = this.bpm;
      this.sequencers.forEach(seq => seq.start(0));
      Tone.Transport.start();
      
      this.isPlaying = true;
      this.isInitialized = true;
      console.log('Audio engine started successfully');
      
    } catch (error) {
      console.error('Failed to start audio:', error);
      this.isPlaying = false;
      throw error;
    }
  }
  
  stop() {
    try {
      Tone.Transport.stop();
      this.sequencers.forEach(seq => {
        try {
          seq.stop();
        } catch (e) {
          // Ignore
        }
      });
      this.isPlaying = false;
      console.log('Audio stopped');
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }
  
  setBPM(bpm) {
    this.bpm = Math.max(60, Math.min(200, bpm));
    if (Tone.Transport) {
      Tone.Transport.bpm.value = this.bpm;
    }
  }
  
  getFFTData() {
    if (!this.analyzer) {
      return new Float32Array(128).fill(-100);
    }
    try {
      const data = this.analyzer.getValue();
      return data;
    } catch (e) {
      return new Float32Array(128).fill(-100);
    }
  }
  
  getWaveformData() {
    return new Float32Array(1024).fill(0);
  }
  
  dispose() {
    try {
      this.stop();
      this.clearSequencers();
      
      if (this.leadSynth) this.leadSynth.dispose();
      if (this.bassSynth) this.bassSynth.dispose();
      if (this.kick) this.kick.dispose();
      
      Object.values(this.effects).forEach(effect => {
        if (effect && effect.dispose) effect.dispose();
      });
      
      if (this.analyzer) this.analyzer.dispose();
      
      this.synthsCreated = false;
      this.isInitialized = false;
    } catch (e) {
      console.error('Disposal error:', e);
    }
  }
  
  // Compatibility methods
  generateNewPattern() {
    this.generateSimplePattern();
  }
  
  mutatePattern() {
    this.generateSimplePattern();
  }
}