import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createFederationApp } from '../../scripts/create-rspack-config.ts';

const context = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (isDev) {
  loadEnvFile(path.join(context, '.env.development'));
  loadEnvFile(path.join(context, '.env'));
}

function remote(
  name: string,
  envKey: string,
  fallback: string,
): string {
  const url = process.env[envKey] ?? fallback;
  return `${name}@${url}`;
}

export default createFederationApp({
  context,
  name: 'shell',
  port: 5000,
  entry: './src/main.tsx',
  htmlTemplate: './index.html',
  copyPublic: true,
  isHost: true,
  remotes: {
    featureCaseSubmission: remote(
      'featureCaseSubmission',
      'VITE_CASE_SUBMISSION_REMOTE',
      'http://localhost:5001/mf-manifest.json',
    ),
    featureSmileSimulation: remote(
      'featureSmileSimulation',
      'VITE_SMILE_SIMULATION_REMOTE',
      'http://localhost:5002/mf-manifest.json',
    ),
    feature3dViewer: remote(
      'feature3dViewer',
      'VITE_3D_VIEWER_REMOTE',
      'http://localhost:5003/mf-manifest.json',
    ),
    featureTreatmentPlan: remote(
      'featureTreatmentPlan',
      'VITE_TREATMENT_PLAN_REMOTE',
      'http://localhost:5004/mf-manifest.json',
    ),
  },
  defines: {
    'import.meta.env.VITE_ENABLE_MSW': JSON.stringify(
      process.env.VITE_ENABLE_MSW ?? '',
    ),
    'import.meta.env.VITE_ENABLE_VIEW_SWITCHER': JSON.stringify(
      process.env.VITE_ENABLE_VIEW_SWITCHER ?? (isDev ? 'true' : ''),
    ),
    'import.meta.env.VITE_CASE_SUBMISSION_REMOTE': JSON.stringify(
      process.env.VITE_CASE_SUBMISSION_REMOTE ?? '',
    ),
    'import.meta.env.VITE_SMILE_SIMULATION_REMOTE': JSON.stringify(
      process.env.VITE_SMILE_SIMULATION_REMOTE ?? '',
    ),
    'import.meta.env.VITE_3D_VIEWER_REMOTE': JSON.stringify(
      process.env.VITE_3D_VIEWER_REMOTE ?? '',
    ),
    'import.meta.env.VITE_TREATMENT_PLAN_REMOTE': JSON.stringify(
      process.env.VITE_TREATMENT_PLAN_REMOTE ?? '',
    ),
  },
});
