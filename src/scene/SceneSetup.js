import * as THREE from 'three';

export class SceneSetup {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.lights = [];
    
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.setupEnvironment();
  }
  
  setupScene() {
    this.scene.fog = new THREE.Fog(0x000033, 5, 50);
    this.scene.background = new THREE.Color(0x000033);
  }
  
  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 0, 0);
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    document.getElementById('app').appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048
    directionalLight.shadow.mapSize.height = 1024; // Better for mobile GPUs
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    const pointLight1 = new THREE.PointLight(0xff00ff, 1, 10);
    pointLight1.position.set(-3, 2, -3);
    this.scene.add(pointLight1);
    this.lights.push(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 1, 10);
    pointLight2.position.set(3, 2, 3);
    this.scene.add(pointLight2);
    this.lights.push(pointLight2);
  }
  
  setupEnvironment() {
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);
    
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    this.createStarField();
  }
  
  createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 500; // Reduced from 5000 for performance
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      // Direct HSL calculation without Color object
      const hue = Math.random() * 0.2 + 0.5;
      const lightness = 0.5 + Math.random() * 0.5;
      // Simple HSL to RGB for stars (blueish tint)
      const color = new THREE.Color().setHSL(hue, 0.5, lightness);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
    
    this.stars = stars;
  }
  
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  update(time) {
    if (this.stars) {
      this.stars.rotation.y = time * 0.05;
    }
    
    for (let i = 2; i < this.lights.length; i++) {
      const light = this.lights[i];
      const angle = time * 0.5 + i * Math.PI;
      light.position.x = Math.cos(angle) * 3;
      light.position.z = Math.sin(angle) * 3;
    }
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}