import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy makes /api and /uploads look same-origin to the browser,
// so httpOnly cookies just work during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
