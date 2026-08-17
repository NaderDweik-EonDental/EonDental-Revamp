import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const base = process.env.VITE_BASE_PATH ?? '/';

const caseSubmissionRemote =
  process.env.VITE_CASE_SUBMISSION_REMOTE ??
  'http://localhost:5001/mf-manifest.json';
const smileSimulationRemote =
  process.env.VITE_SMILE_SIMULATION_REMOTE ??
  'http://localhost:5002/mf-manifest.json';
const viewerRemote =
  process.env.VITE_3D_VIEWER_REMOTE ?? 'http://localhost:5003/mf-manifest.json';
const treatmentPlanRemote =
  process.env.VITE_TREATMENT_PLAN_REMOTE ??
  'http://localhost:5004/mf-manifest.json';

const shared = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
} as const;

export default defineConfig({
  base,
  plugins: [
    // federation before react — avoids orphaned virtual loadShare modules in dev
    federation({
      name: 'shell',
      remotes: {
        featureCaseSubmission: {
          type: 'module',
          name: 'featureCaseSubmission',
          entry: caseSubmissionRemote,
        },
        featureSmileSimulation: {
          type: 'module',
          name: 'featureSmileSimulation',
          entry: smileSimulationRemote,
        },
        feature3dViewer: {
          type: 'module',
          name: 'feature3dViewer',
          entry: viewerRemote,
        },
        featureTreatmentPlan: {
          type: 'module',
          name: 'featureTreatmentPlan',
          entry: treatmentPlanRemote,
        },
      },
      shared,
    }),
    react(),
  ],
  server: {
    port: 5000,
    strictPort: true,
    origin: 'http://localhost:5000',
  },
  preview: {
    port: 5000,
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
