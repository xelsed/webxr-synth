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
    
    this.setupSynths();
    this.setupDrums();
    this.setupEffects();
    this.setupAnalyzer();
    this.generateNewPattern();
  }
  
  setupSynths() {
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      }
    });
    
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
    
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 2
      }
    });
    
    this.arpSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.1
      }
    });
  }
  
  setupDrums() {
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
    
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0
      }
    });
    
    this.hihat = new Tone.MetalSynth({
      frequency: 250,
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    });
    
    this.openhat = new Tone.MetalSynth({
      frequency: 250,
      envelope: {
        attack: 0.001,
        decay: 0.2,
        release: 0.1
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    });
  }
  
  setupEffects() {
    this.effects.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3
    });
    
    this.effects.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.3,
      wet: 0.2
    });
    
    this.effects.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0.3
    });
    
    this.effects.filter = new Tone.AutoFilter({
      frequency: '4n',
      baseFrequency: 200,
      octaves: 3
    });
    
    this.effects.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 12,
      attack: 0.003,
      release: 0.25
    });
    
    this.effects.limiter = new Tone.Limiter(-6);
    
    const drumBus = new Tone.Gain(0.8);
    const synthBus = new Tone.Gain(0.6);
    
    this.kick.connect(drumBus);
    this.snare.connect(drumBus);
    this.hihat.connect(drumBus);
    this.openhat.connect(drumBus);
    
    this.leadSynth.connect(this.effects.delay);
    this.effects.delay.connect(synthBus);
    
    this.bassSynth.connect(this.effects.compressor);
    this.effects.compressor.connect(synthBus);
    
    this.padSynth.connect(this.effects.chorus);
    this.effects.chorus.connect(this.effects.reverb);
    this.effects.reverb.connect(synthBus);
    
    this.arpSynth.connect(this.effects.filter);
    this.effects.filter.connect(synthBus);
    
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
    this.currentPattern = this.beatGenerator.generateDrumPattern(16);
    
    const melody = this.beatGenerator.generateMelody('pentatonic', 16);
    const bassline = this.beatGenerator.generateBassline('C2', this.currentPattern.kick);
    const chords = this.beatGenerator.generateChordProgression();
    
    this.clearSequencers();
    
    const drumSeq = new Tone.Sequence((time, step) => {
      if (this.currentPattern.kick[step] === 1) {
        this.kick.triggerAttackRelease('C1', '8n', time);
      }
      if (this.currentPattern.snare[step] === 1) {
        this.snare.triggerAttackRelease('8n', time);
      }
      if (this.currentPattern.hihat[step] === 1) {
        this.hihat.triggerAttackRelease('C4', '32n', time);
      }
      if (this.currentPattern.openhat[step] === 1) {
        this.openhat.triggerAttackRelease('C4', '16n', time);
      }
    }, [...Array(16).keys()], '16n');
    
    const melodySeq = new Tone.Sequence((time, step) => {
      const note = melody[step % melody.length];
      if (note) {
        this.leadSynth.triggerAttackRelease(note.note, note.duration, time, note.velocity);
      }
    }, [...Array(16).keys()], '16n');
    
    const bassSeq = new Tone.Sequence((time, step) => {
      const note = bassline[step % bassline.length];
      if (note) {
        this.bassSynth.triggerAttackRelease(note.note, note.duration, time, note.velocity);
      }
    }, [...Array(16).keys()], '16n');
    
    const chordSeq = new Tone.Sequence((time, step) => {
      const chord = chords[step % chords.length];
      const notes = this.getChordNotes(chord);
      this.padSynth.triggerAttackRelease(notes, '2n', time, 0.5);
    }, [0, 4, 8, 12], '16n');
    
    const arpPattern = this.beatGenerator.euclideanRhythm(16, 10);
    const arpNotes = this.beatGenerator.getScaleNotes('pentatonic');
    const arpSeq = new Tone.Sequence((time, step) => {
      if (arpPattern[step] === 1) {
        const note = arpNotes[Math.floor(Math.random() * arpNotes.length)];
        this.arpSynth.triggerAttackRelease(note, '32n', time, 0.6);
      }
    }, [...Array(16).keys()], '16n');
    
    this.sequencers = [drumSeq, melodySeq, bassSeq, chordSeq, arpSeq];
  }
  
  getChordNotes(chordName) {
    const chordMap = {
      'C4': ['C4', 'E4', 'G4'],
      'G4': ['G4', 'B4', 'D5'],
      'Am4': ['A4', 'C5', 'E5'],
      'F4': ['F4', 'A4', 'C5'],
      'Em4': ['E4', 'G4', 'B4'],
      'Dm4': ['D4', 'F4', 'A4']
    };
    
    return chordMap[chordName] || ['C4', 'E4', 'G4'];
  }
  
  clearSequencers() {
    this.sequencers.forEach(seq => {
      seq.stop();
      seq.dispose();
    });
    this.sequencers = [];
  }
  
  async start() {
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
    this.sequencers.forEach(seq => seq.stop());
    this.isPlaying = false;
  }
  
  setBPM(bpm) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }
  
  mutatePattern() {
    this.currentPattern.kick = this.beatGenerator.mutatePattern(this.currentPattern.kick);
    this.currentPattern.snare = this.beatGenerator.mutatePattern(this.currentPattern.snare);
    this.generateNewPattern();
  }
  
  getFFTData() {
    return this.analyzer ? this.analyzer.getValue() : new Float32Array(256);
  }
  
  getWaveformData() {
    return this.waveform ? this.waveform.getValue() : new Float32Array(1024);
  }
  
  dispose() {
    this.stop();
    this.clearSequencers();
    
    [this.leadSynth, this.bassSynth, this.padSynth, this.arpSynth,
     this.kick, this.snare, this.hihat, this.openhat].forEach(synth => {
      synth.dispose();
    });
    
    Object.values(this.effects).forEach(effect => {
      effect.dispose();
    });
    
    if (this.analyzer) this.analyzer.dispose();
    if (this.waveform) this.waveform.dispose();
  }
}