import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy removido - usando backend hospedado no Azure diretamente via VITE_API_URL
  },
}); 