
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Permite que process.env seja acessado no navegador durante o build
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    port: 3000
  }
});
