# Performance Optimizations for WebXR Synthesizer

## Critical Issues Found

### 1. **Object Creation in Render Loop** ❌
**Problem:** Creating new THREE.Color objects every frame for 1000+ particles
- Location: `ParticleSystem.js` line 173
- Impact: 60,000+ object allocations per second causing garbage collection spikes

**Solution:**
```javascript
// BAD - Creates new object every frame
const color = new THREE.Color().setHSL(hue, 1, 0.5);

// GOOD - Reuse single object
this.tempColor.setHSL(hue, 1, 0.5);
colors[i3] = this.tempColor.r;
```

### 2. **Excessive Particle/Star Count** ⚠️
- 1000 particles + 5000 stars = 6000 points
- Each requires position, color, size updates per frame

**Solutions:**
- Reduce particles: 1000 → 500
- Reduce stars: 5000 → 2000
- Implement LOD (Level of Detail) system
- Update only visible particles

### 3. **Shadow Mapping Resolution** ⚠️
- Current: 2048x2048 (4MB texture)
- Mobile GPUs struggle with large shadow maps

**Solution:**
```javascript
// Reduce shadow map size
directionalLight.shadow.mapSize.width = 1024;  // Was 2048
directionalLight.shadow.mapSize.height = 1024; // Was 2048
```

### 4. **Geometry Complexity** ⚠️
- IcosahedronGeometry(1, 4) creates 5120 vertices
- 32 separate frequency bar meshes

**Solutions:**
- Reduce subdivision: `IcosahedronGeometry(1, 2)` 
- Use InstancedMesh for frequency bars
- Implement geometry LOD

## Quick Fixes to Apply

```javascript
// 1. In ParticleSystem constructor, add:
this.tempColor = new THREE.Color(); // Reusable color object

// 2. Reduce counts:
this.particleCount = 500; // was 1000
const starCount = 2000; // was 5000

// 3. Reduce shadow quality:
directionalLight.shadow.mapSize.setScalar(1024); // was 2048

// 4. Reduce geometry detail:
new THREE.IcosahedronGeometry(1, 2); // was 4
new THREE.SphereGeometry(0.1, 6, 6); // was 8, 8

// 5. Skip updates when low activity:
if (audioLevel < 0.1) return; // Skip updates when quiet

// 6. Update alternate particles:
for (let i = 0; i < particleCount; i += 2) // Update every 2nd particle
```

## Performance Testing

Monitor these metrics:
- FPS (target: 60 on desktop, 30 on mobile)
- Memory usage (Chrome DevTools → Performance)
- Draw calls (Chrome DevTools → Rendering → Frame Rendering Stats)

## Recommended Settings for Rokid Max 2

```javascript
// Mobile-optimized settings
const MOBILE_CONFIG = {
  particles: 300,
  stars: 1000,
  shadowMapSize: 512,
  pixelRatio: 1.5, // Instead of devicePixelRatio
  antialias: false, // Disable for better performance
  orbDetail: 2 // Icosahedron subdivision level
};
```

## Implementation Priority

1. **High Priority** (Do immediately):
   - Fix Color object creation in particle loop
   - Reduce particle count to 500
   - Reduce shadow map to 1024

2. **Medium Priority**:
   - Reduce star count to 2000
   - Lower geometry subdivision levels
   - Add performance mode toggle

3. **Low Priority**:
   - Implement instanced rendering
   - Add dynamic LOD system
   - Create quality presets