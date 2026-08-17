import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FeatureRoot from './FeatureRoot.js';
import { samplePackageCatalog } from './1-domain/packageCatalog.js';

type DemoVersion = '1.0.0' | '2.1.0';

const DEMO_CONFIGS: Record<DemoVersion, { requireXray: boolean; maxAttachments: number; packages?: typeof samplePackageCatalog }> = {
  '1.0.0': { requireXray: false, maxAttachments: 5 },
  '2.1.0': { requireXray: true, maxAttachments: 8, packages: samplePackageCatalog },
};

function DevHarness() {
  const [version, setVersion] = useState<DemoVersion>('2.1.0');

  return (
    <div>
      <div
        style={{
          padding: '10px 16px',
          background: '#0b1330',
          color: 'white',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          fontFamily: 'sans-serif',
          fontSize: 13,
        }}
      >
        <span>Dev harness — simulate entitlement version:</span>
        {(Object.keys(DEMO_CONFIGS) as DemoVersion[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVersion(v)}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.3)',
              background: version === v ? 'white' : 'transparent',
              color: version === v ? '#0b1330' : 'white',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {v} {v === '2.1.0' ? '(with packages)' : '(no packages)'}
          </button>
        ))}
      </div>
      <FeatureRoot
        config={DEMO_CONFIGS[version]}
        entitlement={{
          featureId: 'case-submission',
          enabled: true,
          version,
        }}
      />
    </div>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <DevHarness />
  </StrictMode>,
);
