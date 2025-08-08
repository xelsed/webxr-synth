import { defineConfig } from 'vite';

export default defineConfig({
  base: '/webxr-synth/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});