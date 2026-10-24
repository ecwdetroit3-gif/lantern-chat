import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built site works under any GitHub Pages
// subdirectory (https://<user>.github.io/<repo>/) without extra config.
// Combined with HashRouter this needs no server-side rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
