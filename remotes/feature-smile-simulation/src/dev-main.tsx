import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FeatureRoot from './FeatureRoot.js';
import type { SmileSimulationFeatureConfig } from './FeatureRoot.js';

type DemoVersion = '1.0.0' | '1.4.0';

const DEMO_CONFIGS: Record<DemoVersion, SmileSimulationFeatureConfig> = {
  '1.0.0': { maxShadeOptions: 0, allowWhiteningPreview: false },
  '1.4.0': { maxShadeOptions: 3, allowWhiteningPreview: true },
};

function DevHarness() {
  const [version, setVersion] = useState<DemoVersion>('1.4.0');

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
            {v}{' '}
            {v === '1.4.0'
              ? '(shade + whitening)'
              : '(no shade or whitening)'}
          </button>
        ))}
      </div>
      <FeatureRoot
        config={DEMO_CONFIGS[version]}
        entitlement={{
          featureId: 'smile-simulation',
          enabled: true,
          version,
        }}
      />
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <DevHarness />
  </StrictMode>,
);
