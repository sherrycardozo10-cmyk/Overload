import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build portable (root domain, sub-path, or file host).
export default defineConfig({
  base: './',
  plugins: [react()],
});
