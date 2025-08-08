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
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.setupSynths();
      this.setupDrums();
      this.setupEffects();
      this.setupAnalyzer();
      this.generateNewPattern();
      this.isInitialized = true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw error;
    }
  }
  
  setupSynths() {
    // Lead synth with character
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      }
    });
    
    // Bass synth for low end
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.2,
        baseFrequency: 200,
        octaves: 2
      }
    });
    
    // Pad for atmosphere
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 2
      }
    });
  }
  
  setupDrums() {
    // Kick drum
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4
      }
    });
    
    // Snare
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0
      }
    });
    
    // Hi-hat (simplified)
    this.hihat = new Tone.MetalSynth({
      frequency: 250,
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 16, // Reduced from 32
      resonance: 2000,     // Reduced from 4000
      octaves: 1
    });
  }
  
  setupEffects() {
    // Light reverb
    this.effects.reverb = new Tone.Reverb({
      decay: 1.5,  // Reduced from 2.5
      wet: 0.2     // Reduced from 0.3
    });
    
    // Simple delay
    this.effects.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.2,  // Reduced from 0.3
      wet: 0.1        // Reduced from 0.2
    });
    
    // Master limiter
    this.effects.limiter = new Tone.Limiter(-3);
    
    // Create buses
    const drumBus = new Tone.Gain(0.7);
    const synthBus = new Tone.Gain(0.5);
    
    // Connect drums (dry)
    this.kick.connect(drumBus);
    this.snare.connect(drumBus);
    this.hihat.connect(drumBus);
    
    // Connect synths with light effects
    this.leadSynth.connect(this.effects.delay);
    this.effects.delay.connect(synthBus);
    
    this.bassSynth.connect(synthBus);
    
    this.padSynth.connect(this.effects.reverb);
    this.effects.reverb.connect(synthBus);
    
    // Master output
    drumBus.connect(this.effects.limiter);
    synthBus.connect(this.effects.limiter);
    this.effects.limiter.toDestination();
  }
  
  setupAnalyzer() {
    this.analyzer = new Tone.Analyser('fft', 256);
    this.effects.limiter.connect(this.analyzer);
    
    this.waveform = new Tone.Analyser('waveform', 1024);
    this.effects.limiter.connect(this.waveform);
  }
  
  generateNewPattern() {
    // Generate rhythmic patterns
    this.currentPattern = this.beatGenerator.generateDrumPattern(16);
    
    const melody = this.beatGenerator.generateMelody('pentatonic', 8);
    const bassline = this.beatGenerator.generateBassline('C2', this.currentPattern.kick);
    const chords = this.beatGenerator.generateChordProgression();
    
    this.clearSequencers();
    
    // Drum sequence
    const drumSeq = new Tone.Sequence((time, step) => {
      if (this.currentPattern.kick[step] === 1) {
        this.kick.triggerAttackRelease('C1', '8n', time);
      }
      if (this.currentPattern.snare[step] === 1) {
        this.snare.triggerAttackRelease('8n', time);
      }
      if (this.currentPattern.hihat[step] === 1) {
        this.hihat.triggerAttackRelease('C4', '32n', time, 0.3);
      }
    }, [...Array(16).keys()], '16n');
    
    // Melody sequence
    const melodySeq = new Tone.Sequence((time, step) => {
      const note = melody[step % melody.length];
      if (note && Math.random() > 0.1) { // Skip some notes for variation
        this.leadSynth.triggerAttackRelease(note.note, note.duration, time, note.velocity * 0.7);
      }
    }, [...Array(16).keys()], '16n');
    
    // Bass sequence
    const bassSeq = new Tone.Sequence((time, step) => {
      const note = bassline[step % bassline.length];
      if (note) {
        this.bassSynth.triggerAttackRelease(note.note, note.duration, time, note.velocity * 0.8);
      }
    }, [...Array(16).keys()], '16n');
    
    // Chord sequence (sparse)
    const chordSeq = new Tone.Sequence((time, step) => {
      const chord = chords[step % chords.length];
      const notes = this.getChordNotes(chord);
      this.padSynth.triggerAttackRelease(notes, '2n', time, 0.3);
    }, [0, 8], '16n'); // Only on beats 1 and 3
    
    this.sequencers = [drumSeq, melodySeq, bassSeq, chordSeq];
  }
  
  getChordNotes(chordName) {
    const chordMap = {
      'C4': ['C3', 'E3', 'G3'],
      'G4': ['G3', 'B3', 'D4'],
      'Am4': ['A3', 'C4', 'E4'],
      'F4': ['F3', 'A3', 'C4'],
      'Em4': ['E3', 'G3', 'B3'],
      'Dm4': ['D3', 'F3', 'A3']
    };
    
    return chordMap[chordName] || ['C3', 'E3', 'G3'];
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
  
  mutatePattern() {
    if (this.currentPattern) {
      this.currentPattern.kick = this.beatGenerator.mutatePattern(this.currentPattern.kick, 0.1);
      this.currentPattern.snare = this.beatGenerator.mutatePattern(this.currentPattern.snare, 0.1);
    }
    this.generateNewPattern();
  }
  
  getFFTData() {
    if (!this.analyzer) return new Float32Array(256);
    try {
      return this.analyzer.getValue();
    } catch (e) {
      return new Float32Array(256);
    }
  }
  
  getWaveformData() {
    if (!this.waveform) return new Float32Array(1024);
    try {
      return this.waveform.getValue();
    } catch (e) {
      return new Float32Array(1024);
    }
  }
  
  dispose() {
    this.stop();
    this.clearSequencers();
    
    try {
      [this.leadSynth, this.bassSynth, this.padSynth,
       this.kick, this.snare, this.hihat].forEach(synth => {
        if (synth) synth.dispose();
      });
      
      Object.values(this.effects).forEach(effect => {
        if (effect && effect.dispose) effect.dispose();
      });
      
      if (this.analyzer) this.analyzer.dispose();
      if (this.waveform) this.waveform.dispose();
    } catch (e) {
      console.warn('Disposal error:', e);
    }
  }
}