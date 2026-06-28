import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const rootDir = resolve(__dirname, 'web');
const outDir = resolve(__dirname, 'web/dist');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: rootDir,
    plugins: [react()],

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(rootDir, 'src/app'),
        '@components': resolve(rootDir, 'src/app/components'),
        '@hooks': resolve(rootDir, 'src/app/hooks'),
        '@utils': resolve(rootDir, 'src/app/utils'),
        '@services': resolve(rootDir, 'src/app/services'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },

    // Development server
    server: {
      host: env.VITE_DEV_HOST || '127.0.0.1',
      port: parseInt(env.VITE_DEV_PORT || '5173', 10),
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
      open: false,
      cors: true,
    },

    // Preview server
    preview: {
      host: '127.0.0.1',
      port: 4173,
      cors: true,
    },

    // Build configuration
    build: {
      outDir,
      emptyOutDir: true,
      target: 'esnext',
      minify: 'terser',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-three': ['three'],
            'vendor-i18n': ['i18next', 'react-i18next'],
            'vendor-ogl': ['ogl'],
          },
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 500,
      reportCompressedSize: true,
    },

    // Optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'three', 'i18next', 'react-i18next'],
      exclude: [],
    },

    // CSS configuration
    css: {
      devSourcemap: mode === 'development',
    },
  };
});
