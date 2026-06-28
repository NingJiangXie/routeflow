import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './web/src/test/setup.js',
    include: ['web/src/**/*.test.{js,jsx}', 'web/src/**/*.spec.{js,jsx}'],
    css: true,
  },
});
