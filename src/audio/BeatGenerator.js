export class BeatGenerator {
  euclideanRhythm(steps, pulses) {
    const pattern = new Array(steps).fill(0);
    
    if (pulses > steps) pulses = steps;
    
    const bresenham = (p, s) => {
      const slope = p / s;
      let error = 0;
      let y = 0;
      
      for (let x = 0; x < s; x++) {
        error += slope;
        if (error >= 0.5) {
          pattern[x] = 1;
          error -= 1;
          y++;
        }
      }
    };
    
    if (pulses > 0) {
      const ratio = steps / pulses;
      for (let i = 0; i < pulses; i++) {
        const index = Math.floor(i * ratio);
        if (index < steps) {
          pattern[index] = 1;
        }
      }
    }
    
    return pattern;
  }
  
  generateDrumPattern(length = 16) {
    return {
      kick: this.euclideanRhythm(length, Math.floor(Math.random() * 4) + 2),
      snare: this.euclideanRhythm(length, Math.floor(Math.random() * 3) + 1),
      hihat: this.euclideanRhythm(length, Math.floor(Math.random() * 8) + 4),
      openhat: this.euclideanRhythm(length, Math.floor(Math.random() * 2) + 1)
    };
  }
  
  generateMelody(scale, length = 8) {
    const melody = [];
    const scaleNotes = this.getScaleNotes(scale);
    let previousNote = null;
    
    for (let i = 0; i < length; i++) {
      if (Math.random() > 0.3 && previousNote !== null) {
        const stepSize = Math.floor(Math.random() * 3) - 1;
        const currentIndex = scaleNotes.indexOf(previousNote);
        let newIndex = currentIndex + stepSize;
        newIndex = Math.max(0, Math.min(scaleNotes.length - 1, newIndex));
        previousNote = scaleNotes[newIndex];
      } else {
        previousNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
      }
      
      melody.push({
        note: previousNote,
        duration: Math.random() > 0.7 ? '8n' : '16n',
        velocity: 0.5 + Math.random() * 0.5
      });
    }
    
    return melody;
  }
  
  getScaleNotes(scaleName = 'pentatonic') {
    const scales = {
      pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
      minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
      major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      blues: ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'],
      chromatic: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']
    };
    
    return scales[scaleName] || scales.pentatonic;
  }
  
  generateBassline(rootNote = 'C2', pattern) {
    const bassNotes = [rootNote, 'G2', 'C3', 'E2', 'F2', 'A2', 'D2', 'B1'];
    const bassline = [];
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === 1) {
        bassline.push({
          note: bassNotes[Math.floor(Math.random() * 4)],
          duration: '8n',
          velocity: 0.7 + Math.random() * 0.3
        });
      } else {
        bassline.push(null);
      }
    }
    
    return bassline;
  }
  
  generateChordProgression() {
    const progressions = [
      ['C4', 'G4', 'Am4', 'F4'],
      ['C4', 'F4', 'G4', 'C4'],
      ['Am4', 'F4', 'C4', 'G4'],
      ['C4', 'Em4', 'F4', 'G4'],
      ['F4', 'G4', 'Am4', 'C4']
    ];
    
    return progressions[Math.floor(Math.random() * progressions.length)];
  }
  
  mutatePattern(pattern, mutationRate = 0.1) {
    return pattern.map(value => {
      if (Math.random() < mutationRate) {
        return value === 1 ? 0 : 1;
      }
      return value;
    });
  }
  
  combinePatterns(pattern1, pattern2, mode = 'or') {
    const result = [];
    const maxLength = Math.max(pattern1.length, pattern2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const val1 = pattern1[i % pattern1.length];
      const val2 = pattern2[i % pattern2.length];
      
      switch (mode) {
        case 'and':
          result.push(val1 && val2 ? 1 : 0);
          break;
        case 'xor':
          result.push(val1 !== val2 ? 1 : 0);
          break;
        case 'or':
        default:
          result.push(val1 || val2 ? 1 : 0);
          break;
      }
    }
    
    return result;
  }
  
  generatePolyrhythm(meter1, meter2, length = 16) {
    const pattern1 = this.euclideanRhythm(length, meter1);
    const pattern2 = this.euclideanRhythm(length, meter2);
    
    return {
      pattern1,
      pattern2,
      combined: this.combinePatterns(pattern1, pattern2, 'xor')
    };
  }
}