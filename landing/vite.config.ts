import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.VITE_BASE_URL || './',
  plugins: [
    tailwindcss(),
    solidPlugin(),
  ],
  server: {
    port: 3001,
  },
  build: {
    target: 'esnext',
  },
});
