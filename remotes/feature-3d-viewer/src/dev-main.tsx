import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FeatureRoot from './FeatureRoot.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <FeatureRoot
      config={{ allowedFormats: ['stl', 'ply'], defaultCamera: 'front' }}
      entitlement={{
        featureId: '3d-viewer',
        enabled: true,
        version: '1.3.1',
      }}
    />
  </StrictMode>,
);
