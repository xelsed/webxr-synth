import * as THREE from 'three';

export class FrequencyBars {
  constructor(scene) {
    this.scene = scene;
    this.barsGroup = new THREE.Group();
    this.bars = [];
    this.barCount = 32;
    this.radius = 3;
    
    this.createBars();
    this.scene.add(this.barsGroup);
  }
  
  createBars() {
    const barWidth = 0.1;
    const barDepth = 0.1;
    const maxHeight = 2;
    
    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2;
      
      const geometry = new THREE.BoxGeometry(barWidth, maxHeight, barDepth);
      geometry.translate(0, maxHeight / 2, 0);
      
      const hue = i / this.barCount;
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.5),
        emissive: new THREE.Color().setHSL(hue, 1, 0.3),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      });
      
      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = Math.cos(angle) * this.radius;
      bar.position.z = Math.sin(angle) * this.radius;
      bar.rotation.y = -angle;
      
      this.bars.push({
        mesh: bar,
        targetScale: 0.1,
        currentScale: 0.1,
        baseHue: hue
      });
      
      this.barsGroup.add(bar);
      
      const glowGeometry = new THREE.BoxGeometry(barWidth * 1.5, maxHeight, barDepth * 1.5);
      glowGeometry.translate(0, maxHeight / 2, 0);
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.5),
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(bar.position);
      glow.rotation.copy(bar.rotation);
      
      bar.glow = glow;
      this.barsGroup.add(glow);
    }
    
    this.createBase();
  }
  
  createBase() {
    const baseGeometry = new THREE.RingGeometry(this.radius - 0.2, this.radius + 0.2, 64);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x222255,
      emissive: 0x111133,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = -0.01;
    
    this.barsGroup.add(base);
    
    const innerRingGeometry = new THREE.RingGeometry(this.radius - 0.5, this.radius - 0.3, 64);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0;
    
    this.barsGroup.add(innerRing);
  }
  
  update(deltaTime, audioData) {
    if (!audioData || audioData.length === 0) return;
    
    const samplesPerBar = Math.floor(audioData.length / this.barCount);
    
    for (let i = 0; i < this.barCount; i++) {
      const bar = this.bars[i];
      
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        const index = i * samplesPerBar + j;
        if (index < audioData.length) {
          sum += Math.abs(audioData[index]);
        }
      }
      
      const average = sum / samplesPerBar;
      const normalizedHeight = Math.min((average + 140) / 100, 2);
      
      bar.targetScale = Math.max(0.1, normalizedHeight);
      
      bar.currentScale += (bar.targetScale - bar.currentScale) * deltaTime * 10;
      
      bar.mesh.scale.y = bar.currentScale;
      
      if (bar.mesh.glow) {
        bar.mesh.glow.scale.y = bar.currentScale;
        bar.mesh.glow.material.opacity = 0.1 + (bar.currentScale - 0.1) * 0.2;
      }
      
      const brightness = Math.min(bar.currentScale / 2, 1);
      bar.mesh.material.emissiveIntensity = 0.3 + brightness * 0.7;
      
      const hueShift = bar.currentScale * 0.1;
      bar.mesh.material.color.setHSL(
        (bar.baseHue + hueShift) % 1,
        1,
        0.4 + brightness * 0.3
      );
      
      bar.mesh.material.emissive.setHSL(
        (bar.baseHue + hueShift) % 1,
        1,
        0.2 + brightness * 0.3
      );
    }
    
    this.barsGroup.rotation.y += deltaTime * 0.1;
  }
  
  setPosition(x, y, z) {
    this.barsGroup.position.set(x, y, z);
  }
  
  setVisible(visible) {
    this.barsGroup.visible = visible;
  }
  
  dispose() {
    this.bars.forEach(bar => {
      bar.mesh.geometry.dispose();
      bar.mesh.material.dispose();
      
      if (bar.mesh.glow) {
        bar.mesh.glow.geometry.dispose();
        bar.mesh.glow.material.dispose();
      }
    });
    
    this.scene.remove(this.barsGroup);
  }
}