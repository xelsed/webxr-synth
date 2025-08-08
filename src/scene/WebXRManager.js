import * as THREE from 'three';

export class WebXRManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.xrSession = null;
    this.controllers = [];
    this.isSupported = false;
    this.isInXR = false;
    
    this.init();
  }
  
  async init() {
    if ('xr' in navigator) {
      try {
        this.isSupported = await navigator.xr.isSessionSupported('immersive-ar') ||
                          await navigator.xr.isSessionSupported('immersive-vr');
        
        if (this.isSupported) {
          this.renderer.xr.enabled = true;
          this.setupControllers();
        }
      } catch (e) {
        console.log('WebXR not available:', e);
      }
    }
  }
  
  setupControllers() {
    for (let i = 0; i <= 1; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onSelectStart.bind(this));
      controller.addEventListener('selectend', this.onSelectEnd.bind(this));
      controller.addEventListener('connected', (event) => {
        this.onControllerConnected(event, controller);
      });
      controller.addEventListener('disconnected', () => {
        this.onControllerDisconnected(controller);
      });
      
      this.scene.add(controller);
      this.controllers.push(controller);
      
      const controllerGrip = this.renderer.xr.getControllerGrip(i);
      this.scene.add(controllerGrip);
      
      const line = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);
      
      const rayMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        linewidth: 2,
        opacity: 0.5,
        transparent: true
      });
      
      controller.ray = new THREE.Line(line, rayMaterial);
      controller.add(controller.ray);
    }
  }
  
  onControllerConnected(event, controller) {
    const data = event.data;
    
    if (data.targetRayMode === 'tracked-pointer') {
      const geometry = new THREE.SphereGeometry(0.02, 8, 6);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      controller.pointer = mesh;
      controller.add(mesh);
    }
    
    if (data.gamepad) {
      controller.gamepad = data.gamepad;
    }
  }
  
  onControllerDisconnected(controller) {
    if (controller.pointer) {
      controller.remove(controller.pointer);
      controller.pointer = null;
    }
  }
  
  onSelectStart(event) {
    const controller = event.target;
    if (controller.pointer) {
      controller.pointer.material.color.setHex(0xff0088);
    }
    this.scene.dispatchEvent({ 
      type: 'xr-select-start', 
      controller: controller,
      position: controller.position.clone()
    });
  }
  
  onSelectEnd(event) {
    const controller = event.target;
    if (controller.pointer) {
      controller.pointer.material.color.setHex(0x00ff88);
    }
    this.scene.dispatchEvent({ 
      type: 'xr-select-end', 
      controller: controller,
      position: controller.position.clone()
    });
  }
  
  async enterXR(mode = 'immersive-ar') {
    if (!this.isSupported) {
      console.warn('WebXR not supported');
      return false;
    }
    
    try {
      const sessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
      };
      
      try {
        this.xrSession = await navigator.xr.requestSession(mode, sessionInit);
      } catch (e) {
        console.log(`${mode} not available, trying immersive-vr`);
        this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
      }
      
      this.renderer.xr.setSession(this.xrSession);
      this.isInXR = true;
      
      this.xrSession.addEventListener('end', () => {
        this.isInXR = false;
        this.xrSession = null;
      });
      
      return true;
    } catch (e) {
      console.error('Failed to enter XR:', e);
      return false;
    }
  }
  
  exitXR() {
    if (this.xrSession) {
      this.xrSession.end();
    }
  }
  
  update() {
    for (const controller of this.controllers) {
      if (controller.gamepad) {
        const gamepad = controller.gamepad;
        
        if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
          controller.ray.material.color.setHex(0xff0088);
        } else {
          controller.ray.material.color.setHex(0x00ff88);
        }
        
        if (gamepad.axes && gamepad.axes.length >= 2) {
          this.scene.dispatchEvent({
            type: 'xr-thumbstick',
            controller: controller,
            x: gamepad.axes[0],
            y: gamepad.axes[1]
          });
        }
      }
    }
  }
  
  getControllers() {
    return this.controllers;
  }
}