// Performance configuration for different devices
export const PERFORMANCE_CONFIG = {
  // High-end desktop
  high: {
    particles: 500,
    stars: 2000,
    shadowMapSize: 2048,
    orbDetail: 4,
    antialias: true,
    pixelRatio: window.devicePixelRatio
  },
  
  // Standard/mobile (Rokid Max 2)
  medium: {
    particles: 200,
    stars: 500,
    shadowMapSize: 1024,
    orbDetail: 3,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
  },
  
  // Low-end/battery saving
  low: {
    particles: 100,
    stars: 200,
    shadowMapSize: 512,
    orbDetail: 2,
    antialias: false,
    pixelRatio: 1
  }
};

// Auto-detect best config based on device
export function getOptimalConfig() {
  // Check if mobile/AR device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAR = 'xr' in navigator;
  
  if (isMobile || isAR) {
    return PERFORMANCE_CONFIG.medium;
  }
  
  // Check GPU capabilities if available
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Check for integrated/low-end GPUs
      if (/Intel|Mali|Adreno|PowerVR/i.test(renderer)) {
        return PERFORMANCE_CONFIG.low;
      }
    }
  }
  
  return PERFORMANCE_CONFIG.high;
}