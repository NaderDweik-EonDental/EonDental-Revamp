import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    federation({
      name: 'featureCaseSubmission',
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
    port: 5001,
    strictPort: true,
    origin: 'http://localhost:5001',
    cors: true,
  },
  preview: {
    port: 5001,
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
