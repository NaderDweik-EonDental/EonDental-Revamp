import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const base = process.env.VITE_BASE_PATH ?? '/';

function alias(to: string): string {
  return fileURLToPath(new URL(to, import.meta.url));
}

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@/app': alias('./src/1-app'),
      '@/pages': alias('./src/2-pages'),
      '@/widgets': alias('./src/3-widgets'),
      '@/features': alias('./src/4-features'),
      '@/entities': alias('./src/5-entities'),
      '@/shared': alias('./src/6-shared'),
    },
  },
  plugins: [
    federation({
      name: 'featureTreatmentPlan',
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
    port: 5004,
    strictPort: true,
    origin: 'http://localhost:5004',
    cors: true,
  },
  preview: {
    port: 5004,
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
