import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La clave de IA ya no se inyecta en el bundle: el backend la usa.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
