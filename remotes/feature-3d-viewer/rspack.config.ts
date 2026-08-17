import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFederationApp } from '../../scripts/create-rspack-config.ts';

const context = path.dirname(fileURLToPath(import.meta.url));

export default createFederationApp({
  context,
  name: 'feature3dViewer',
  port: 5003,
  entry: './src/dev-entry.ts',
  htmlTemplate: './index.html',
  exposes: {
    './FeatureRoot': './src/FeatureRoot.tsx',
  },
});
