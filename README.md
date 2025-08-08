# WebXR Audio Synthesizer

An interactive 3D WebXR synthesizer with algorithmic beat generation and audio-reactive visualizations, optimized for Rokid Max 2 AR glasses.

## Features

- **WebXR Support** - Full AR/VR compatibility with controller tracking
- **Algorithmic Music** - Euclidean rhythms, generative melodies, dynamic basslines
- **Audio Visualizations**:
  - Pulsating orb with custom shaders
  - 3D frequency spectrum bars
  - Particle system with audio-reactive emitters
- **Interactive 3D Controls** - BPM, pattern, and visual mode selection
- **Multiple Visual Modes** - All, Orb, Bars, Particles, Minimal, Psychedelic

## Technologies

- **Three.js** - 3D graphics and WebXR scene management
- **Tone.js** - Audio synthesis and algorithmic composition
- **Web Audio API** - Real-time audio analysis
- **WebXR Device API** - Immersive AR/VR experiences
- **GLSL Shaders** - Custom visual effects

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Access at `http://localhost:3000`

## Build

```bash
npm run build
```

## Controls

### Keyboard
- **Spacebar** - Play/Pause
- **M** - Cycle visual modes
- **R** - Reset
- **N** - Generate new pattern
- **Arrow Up/Down** - Adjust BPM

### Mouse/Touch
- Click on 3D control panels to interact

### WebXR
- Controller trigger to select UI elements
- Thumbstick to adjust BPM

## Rokid Max 2 Optimization

- Optimized for 50° FOV
- 1920x1080 per eye resolution
- 120Hz refresh rate support
- Direct USB-C connection ready

## License

ISC