import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FeatureRoot from './FeatureRoot.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <FeatureRoot
      config={{ maxShadeOptions: 3, allowWhiteningPreview: true }}
      entitlement={{
        featureId: 'smile-simulation',
        enabled: true,
        version: '1.4.0',
      }}
    />
  </StrictMode>,
);
