import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    federation({
      name: 'featureSmileSimulation',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: {
        './FeatureRoot': './src/FeatureRoot.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
    react(),
  ],
  server: {
    port: 5002,
    strictPort: true,
    origin: 'http://localhost:5002',
    cors: true,
  },
  preview: {
    port: 5002,
    strictPort: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
  build: {
    target: 'esnext',
    modulePreload: false,
  },
});
