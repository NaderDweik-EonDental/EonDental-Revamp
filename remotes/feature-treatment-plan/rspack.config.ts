import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFederationApp } from '../../scripts/create-rspack-config.ts';

const context = path.dirname(fileURLToPath(import.meta.url));

export default createFederationApp({
  context,
  name: 'featureTreatmentPlan',
  port: 5004,
  entry: './src/dev-entry.ts',
  htmlTemplate: './index.html',
  exposes: {
    './FeatureRoot': './src/FeatureRoot.tsx',
  },
  aliases: {
    '@/app': path.join(context, 'src/1-app'),
    '@/pages': path.join(context, 'src/2-pages'),
    '@/widgets': path.join(context, 'src/3-widgets'),
    '@/features': path.join(context, 'src/4-features'),
    '@/entities': path.join(context, 'src/5-entities'),
    '@/shared': path.join(context, 'src/6-shared'),
  },
});
