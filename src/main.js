import * as THREE from 'three';
import { SceneSetup } from './scene/SceneSetup.js';
import { WebXRManager } from './scene/WebXRManager.js';
import { SynthEngine } from './audio/SynthEngine.js';
import { OrbVisualizer } from './visuals/OrbVisualizer.js';
import { FrequencyBars } from './visuals/FrequencyBars.js';
import { ParticleSystem } from './visuals/ParticleSystem.js';
import { ControlPanels } from './ui/ControlPanels.js';

class WebXRSynth {
  constructor() {
    this.sceneSetup = null;
    this.xrManager = null;
    this.synthEngine = null;
    this.visualizers = {};
    this.controlPanels = null;
    this.clock = new THREE.Clock();
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentMode = 'all';
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.init();
  }
  
  async init() {
    try {
      this.sceneSetup = new SceneSetup();
      
      this.xrManager = new WebXRManager(
        this.sceneSetup.renderer,
        this.sceneSetup.scene,
        this.sceneSetup.camera
      );
      
      this.synthEngine = new SynthEngine();
      
      this.visualizers.orb = new OrbVisualizer(this.sceneSetup.scene);
      this.visualizers.orb.setPosition(0, 1, 0);
      
      this.visualizers.bars = new FrequencyBars(this.sceneSetup.scene);
      this.visualizers.bars.setPosition(0, 0, 0);
      
      this.visualizers.particles = new ParticleSystem(this.sceneSetup.scene);
      this.visualizers.particles.setPosition(0, 0, 0);
      
      this.controlPanels = new ControlPanels(this.sceneSetup.scene);
      
      this.setupEventListeners();
      this.setupXREvents();
      
      document.getElementById('loading').style.display = 'none';
      
      this.isInitialized = true;
      this.animate();
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      document.getElementById('loading').textContent = 'Failed to initialize: ' + error.message;
    }
  }
  
  setupEventListeners() {
    const playButton = document.getElementById('play-button');
    const xrButton = document.getElementById('xr-button');
    const modeButton = document.getElementById('mode-button');
    const resetButton = document.getElementById('reset-button');
    
    playButton.addEventListener('click', () => {
      this.togglePlayback();
    });
    
    xrButton.addEventListener('click', async () => {
      if (this.xrManager.isSupported) {
        const success = await this.xrManager.enterXR();
        if (success) {
          xrButton.textContent = 'Exit XR';
          document.getElementById('controls').style.display = 'none';
        }
      } else {
        alert('WebXR not supported on this device/browser');
      }
    });
    
    modeButton.addEventListener('click', () => {
      this.cycleVisualMode();
    });
    
    resetButton.addEventListener('click', () => {
      this.reset();
    });
    
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    window.addEventListener('click', (event) => {
      if (event.target.tagName !== 'BUTTON') {
        this.handleClick();
      }
    });
    
    window.addEventListener('keydown', (event) => {
      switch(event.key) {
        case ' ':
          event.preventDefault();
          this.togglePlayback();
          break;
        case 'm':
          this.cycleVisualMode();
          break;
        case 'r':
          this.reset();
          break;
        case 'n':
          this.synthEngine.generateNewPattern();
          break;
        case 'ArrowUp':
          this.synthEngine.setBPM(Math.min(this.synthEngine.bpm + 10, 200));
          document.getElementById('bpm').textContent = this.synthEngine.bpm;
          break;
        case 'ArrowDown':
          this.synthEngine.setBPM(Math.max(this.synthEngine.bpm - 10, 60));
          document.getElementById('bpm').textContent = this.synthEngine.bpm;
          break;
      }
    });
  }
  
  setupXREvents() {
    this.sceneSetup.scene.addEventListener('xr-select-start', (event) => {
      const position = event.position;
      this.visualizers.particles.burst(position, 100);
    });
    
    this.sceneSetup.scene.addEventListener('xr-select-end', (event) => {
      this.handleXRSelection(event.controller);
    });
    
    this.sceneSetup.scene.addEventListener('xr-thumbstick', (event) => {
      if (Math.abs(event.x) > 0.5) {
        const newBPM = this.synthEngine.bpm + (event.x > 0 ? 5 : -5);
        this.synthEngine.setBPM(Math.max(60, Math.min(200, newBPM)));
      }
    });
  }
  
  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.sceneSetup.camera);
    const hoveredButton = this.controlPanels.handleRaycast(this.raycaster);
    
    if (hoveredButton) {
      const selection = this.controlPanels.selectButton(hoveredButton);
      this.handleControlSelection(selection);
    }
  }
  
  handleXRSelection(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    const hoveredButton = this.controlPanels.handleRaycast(this.raycaster);
    
    if (hoveredButton) {
      const selection = this.controlPanels.selectButton(hoveredButton);
      this.handleControlSelection(selection);
    }
  }
  
  handleControlSelection(selection) {
    switch(selection.type) {
      case 'bpm':
        const bpm = parseInt(selection.value);
        this.synthEngine.setBPM(bpm);
        document.getElementById('bpm').textContent = bpm;
        break;
        
      case 'pattern':
        if (selection.value === 'Random') {
          this.synthEngine.generateNewPattern();
        } else {
          this.synthEngine.mutatePattern();
        }
        break;
        
      case 'visual':
        this.setVisualMode(selection.value.toLowerCase());
        break;
    }
  }
  
  togglePlayback() {
    if (this.isPlaying) {
      this.synthEngine.stop();
      this.isPlaying = false;
      document.getElementById('play-button').textContent = 'Play';
    } else {
      this.synthEngine.start();
      this.isPlaying = true;
      document.getElementById('play-button').textContent = 'Pause';
    }
  }
  
  cycleVisualMode() {
    const modes = ['all', 'orb', 'bars', 'particles', 'minimal', 'psychedelic'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setVisualMode(modes[nextIndex]);
  }
  
  setVisualMode(mode) {
    this.currentMode = mode;
    
    this.visualizers.orb.setVisible(false);
    this.visualizers.bars.setVisible(false);
    this.visualizers.particles.setVisible(false);
    
    switch(mode) {
      case 'all':
        this.visualizers.orb.setVisible(true);
        this.visualizers.bars.setVisible(true);
        this.visualizers.particles.setVisible(true);
        break;
      case 'orb':
        this.visualizers.orb.setVisible(true);
        break;
      case 'bars':
        this.visualizers.bars.setVisible(true);
        break;
      case 'particles':
        this.visualizers.particles.setVisible(true);
        break;
      case 'minimal':
        this.visualizers.orb.setVisible(true);
        break;
      case 'psychedelic':
        this.visualizers.orb.setVisible(true);
        this.visualizers.particles.setVisible(true);
        this.sceneSetup.scene.fog.color.setHSL(
          (Date.now() * 0.0001) % 1,
          0.5,
          0.1
        );
        break;
    }
  }
  
  reset() {
    this.synthEngine.generateNewPattern();
    this.synthEngine.setBPM(120);
    this.setVisualMode('all');
    document.getElementById('bpm').textContent = '120';
  }
  
  animate() {
    this.sceneSetup.renderer.setAnimationLoop(() => {
      const deltaTime = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();
      
      const fftData = this.synthEngine.getFFTData();
      
      this.visualizers.orb.update(deltaTime, fftData);
      this.visualizers.bars.update(deltaTime, fftData);
      this.visualizers.particles.update(deltaTime, fftData);
      
      this.controlPanels.update(deltaTime);
      
      this.sceneSetup.update(elapsedTime);
      
      if (this.xrManager.isInXR) {
        this.xrManager.update();
      } else {
        this.raycaster.setFromCamera(this.mouse, this.sceneSetup.camera);
        this.controlPanels.handleRaycast(this.raycaster);
      }
      
      this.sceneSetup.render();
      
      const fps = Math.round(1 / deltaTime);
      document.getElementById('fps').textContent = fps;
    });
  }
  
  dispose() {
    if (this.synthEngine) {
      this.synthEngine.dispose();
    }
    
    Object.values(this.visualizers).forEach(viz => {
      if (viz.dispose) viz.dispose();
    });
    
    if (this.controlPanels) {
      this.controlPanels.dispose();
    }
    
    if (this.xrManager) {
      this.xrManager.exitXR();
    }
  }
}

const app = new WebXRSynth();

window.addEventListener('beforeunload', () => {
  app.dispose();
});