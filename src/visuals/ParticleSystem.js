import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 200; // Reduced from 1000 for performance
    this.particles = null;
    this.particleGroup = new THREE.Group();
    this.time = 0;
    
    this.createParticles();
    this.scene.add(this.particleGroup);
  }
  
  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const velocities = new Float32Array(this.particleCount * 3);
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      const height = (Math.random() - 0.5) * 4;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = Math.random() * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Use temporary color to avoid creating objects in loop
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    this.velocities = velocities;
    this.initialPositions = new Float32Array(positions);
    
    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      varying float vSize;
      
      void main() {
        vColor = color;
        vSize = size;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * 300.0 / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      uniform float audioLevel;
      varying vec3 vColor;
      varying float vSize;
      
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha *= 0.5 + audioLevel * 0.5;
        
        vec3 finalColor = vColor * (1.0 + audioLevel);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        audioLevel: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particleGroup.add(this.particles);
    
    this.createEmitters();
  }
  
  createEmitters() {
    this.emitters = [];
    
    for (let i = 0; i < 3; i++) {
      const emitterGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const emitterMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / 3, 1, 0.5),
        transparent: true,
        opacity: 0.5
      });
      
      const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
      const angle = (i / 3) * Math.PI * 2;
      emitter.position.set(
        Math.cos(angle) * 2,
        0,
        Math.sin(angle) * 2
      );
      
      this.emitters.push(emitter);
      this.particleGroup.add(emitter);
    }
  }
  
  update(deltaTime, audioData) {
    this.time += deltaTime;
    
    let audioLevel = 0;
    if (audioData && audioData.length > 0) {
      const sum = audioData.reduce((a, b) => a + Math.abs(b), 0);
      audioLevel = Math.min(sum / audioData.length / 128 + 40, 1);
    }
    
    if (this.particles && this.particles.material.uniforms) {
      this.particles.material.uniforms.audioLevel.value = audioLevel;
    }
    
    const positions = this.particles.geometry.attributes.position.array;
    const colors = this.particles.geometry.attributes.color.array;
    const sizes = this.particles.geometry.attributes.size.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      positions[i3] += this.velocities[i3] + Math.sin(this.time + i) * 0.001;
      positions[i3 + 1] += this.velocities[i3 + 1] + audioLevel * 0.01;
      positions[i3 + 2] += this.velocities[i3 + 2] + Math.cos(this.time + i) * 0.001;
      
      const distance = Math.sqrt(
        positions[i3] * positions[i3] +
        positions[i3 + 2] * positions[i3 + 2]
      );
      
      if (distance > 5 || distance < 1 || positions[i3 + 1] > 3 || positions[i3 + 1] < -3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2 + Math.random() * 3;
        
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 2;
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        this.velocities[i3] = (Math.random() - 0.5) * 0.02;
        this.velocities[i3 + 1] = Math.random() * 0.02;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      
      // Update colors with proper RGB values
      const hue = (this.time * 0.1 + i * 0.001) % 1;
      const saturation = 1;
      const lightness = 0.5 + audioLevel * 0.5;
      
      // Convert HSL to RGB (simplified for performance)
      const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
      const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
      const m = lightness - c / 2;
      
      let r, g, b;
      if (hue < 1/6) {
        r = c; g = x; b = 0;
      } else if (hue < 2/6) {
        r = x; g = c; b = 0;
      } else if (hue < 3/6) {
        r = 0; g = c; b = x;
      } else if (hue < 4/6) {
        r = 0; g = x; b = c;
      } else if (hue < 5/6) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }
      
      colors[i3] = r + m;
      colors[i3 + 1] = g + m;
      colors[i3 + 2] = b + m;
      
      sizes[i] = (0.05 + Math.sin(this.time * 2 + i) * 0.02) * (1 + audioLevel);
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;
    
    this.particleGroup.rotation.y += deltaTime * 0.05;
    
    this.emitters.forEach((emitter, index) => {
      const angle = this.time * 0.5 + (index / 3) * Math.PI * 2;
      emitter.position.x = Math.cos(angle) * 2;
      emitter.position.z = Math.sin(angle) * 2;
      emitter.position.y = Math.sin(this.time * 2 + index) * 0.5;
      
      emitter.scale.setScalar(1 + audioLevel * 0.5);
      emitter.material.opacity = 0.3 + audioLevel * 0.4;
    });
  }
  
  burst(position, count = 50) {
    const positions = this.particles.geometry.attributes.position.array;
    
    for (let i = 0; i < Math.min(count, this.particleCount); i++) {
      const i3 = i * 3;
      
      positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
      
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = Math.random() * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
  
  setPosition(x, y, z) {
    this.particleGroup.position.set(x, y, z);
  }
  
  setVisible(visible) {
    this.particleGroup.visible = visible;
  }
  
  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
    
    this.emitters.forEach(emitter => {
      emitter.geometry.dispose();
      emitter.material.dispose();
    });
    
    this.scene.remove(this.particleGroup);
  }
}