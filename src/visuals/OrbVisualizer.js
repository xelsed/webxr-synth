import * as THREE from 'three';

export class OrbVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.orb = null;
    this.innerOrb = null;
    this.orbGroup = new THREE.Group();
    this.time = 0;
    this.audioData = null;
    
    this.createOrb();
    this.createInnerOrb();
    this.createRings();
    this.scene.add(this.orbGroup);
  }
  
  createOrb() {
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    
    const vertexShader = `
      uniform float time;
      uniform float audioLevel;
      uniform float bassLevel;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        
        float noise = snoise(position * 2.0 + time * 0.5);
        float displacement = noise * 0.3 * (0.5 + audioLevel);
        displacement += bassLevel * 0.2 * sin(position.y * 10.0 + time * 2.0);
        
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        vDisplacement = displacement;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform float time;
      uniform float audioLevel;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
        
        vec3 color = mix(color1, color2, vDisplacement + 0.5);
        color += fresnel * 0.5;
        
        float glow = fresnel * (0.5 + audioLevel * 0.5);
        color += vec3(glow);
        
        gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        bassLevel: { value: 0 },
        color1: { value: new THREE.Color(0x00ffff) },
        color2: { value: new THREE.Color(0xff00ff) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: true
    });
    
    this.orb = new THREE.Mesh(geometry, material);
    this.orbGroup.add(this.orb);
  }
  
  createInnerOrb() {
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    this.innerOrb = new THREE.Mesh(geometry, material);
    this.orbGroup.add(this.innerOrb);
    
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    this.glowOrb = new THREE.Mesh(glowGeometry, glowMaterial);
    this.orbGroup.add(this.glowOrb);
  }
  
  createRings() {
    const ringCount = 3;
    this.rings = [];
    
    for (let i = 0; i < ringCount; i++) {
      const radius = 1.5 + i * 0.3;
      const geometry = new THREE.TorusGeometry(radius, 0.02, 8, 64);
      
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / ringCount, 1, 0.5),
        transparent: true,
        opacity: 0.6
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      
      this.rings.push(ring);
      this.orbGroup.add(ring);
    }
  }
  
  update(deltaTime, audioData) {
    this.time += deltaTime;
    this.audioData = audioData;
    
    if (!audioData) return;
    
    const avgLevel = audioData.reduce((a, b) => a + Math.abs(b), 0) / audioData.length;
    const bassLevel = audioData.slice(0, 8).reduce((a, b) => a + Math.abs(b), 0) / 8;
    const trebleLevel = audioData.slice(-8).reduce((a, b) => a + Math.abs(b), 0) / 8;
    
    const normalizedAvg = Math.min(avgLevel / 128 + 40, 1);
    const normalizedBass = Math.min(bassLevel / 128 + 40, 1);
    const normalizedTreble = Math.min(trebleLevel / 128 + 40, 1);
    
    if (this.orb && this.orb.material.uniforms) {
      this.orb.material.uniforms.time.value = this.time;
      this.orb.material.uniforms.audioLevel.value = normalizedAvg;
      this.orb.material.uniforms.bassLevel.value = normalizedBass;
      
      this.orb.material.uniforms.color1.value.setHSL(
        (this.time * 0.1) % 1,
        0.8,
        0.5 + normalizedTreble * 0.3
      );
      
      this.orb.material.uniforms.color2.value.setHSL(
        ((this.time * 0.1) + 0.5) % 1,
        0.8,
        0.5 + normalizedBass * 0.3
      );
    }
    
    const scale = 1 + normalizedBass * 0.3;
    this.orbGroup.scale.set(scale, scale, scale);
    
    this.orbGroup.rotation.y += deltaTime * 0.2;
    this.orbGroup.rotation.x = Math.sin(this.time * 0.3) * 0.1;
    
    if (this.innerOrb) {
      this.innerOrb.scale.set(
        1 + Math.sin(this.time * 2) * 0.1 * normalizedAvg,
        1 + Math.cos(this.time * 2) * 0.1 * normalizedAvg,
        1 + Math.sin(this.time * 2 + Math.PI / 2) * 0.1 * normalizedAvg
      );
      
      this.innerOrb.material.emissiveIntensity = 0.3 + normalizedAvg * 0.7;
    }
    
    if (this.glowOrb) {
      this.glowOrb.material.opacity = 0.1 + normalizedAvg * 0.2;
      this.glowOrb.scale.set(
        1 + normalizedBass * 0.2,
        1 + normalizedBass * 0.2,
        1 + normalizedBass * 0.2
      );
    }
    
    this.rings.forEach((ring, i) => {
      ring.rotation.x += deltaTime * (0.5 + i * 0.1);
      ring.rotation.y += deltaTime * (0.3 + i * 0.15);
      ring.material.opacity = 0.3 + normalizedAvg * 0.4;
      
      const ringScale = 1 + Math.sin(this.time * 2 + i * Math.PI / 3) * 0.1 * normalizedAvg;
      ring.scale.set(ringScale, ringScale, 1);
    });
  }
  
  setPosition(x, y, z) {
    this.orbGroup.position.set(x, y, z);
  }
  
  dispose() {
    this.orbGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.scene.remove(this.orbGroup);
  }
}