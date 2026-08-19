import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // Project Pages URL is /hydration/; keep / in `vite` so local/LAN still works.
  base: command === 'build' ? '/hydration/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
}));
