import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FeatureRoot from './FeatureRoot.js';
import type { CaseConfig, CasePackage } from './1-domain/caseRules.js';

type DemoVersion = '1.0.0' | '2.1.0';

/** Mirrors mocks/config-api/data/feature-configs.json so the isolated harness matches shell. */
const DEMO_PACKAGES: CasePackage[] = [
  {
    id: 'mov-10',
    code: "MOV' 10",
    label: "MOV' 10",
    accent: 'graphite',
    description: 'Best for mild cases like crowding, spacing, or relapse.',
    maxAlignerSteps: 10,
    durationMonths: 12,
    refinements: 1,
    tsRevisions: 2,
    retainerSets: 1,
  },
  {
    id: 'eon-basic',
    code: 'EON_BASIC',
    label: 'EON_BASIC',
    accent: 'slate',
    description: 'Best for mild cases like crowding, spacing, or relapse.',
    maxAlignerSteps: 10,
    durationMonths: 'unlimited',
    refinements: 1,
    tsRevisions: 'unlimited',
    retainerSets: 'unlimited',
  },
  {
    id: 'eon-plus',
    code: 'EON_PLUS',
    label: 'EON_PLUS',
    accent: 'emerald',
    description: 'Covers a wide range of mild to moderate cases.',
    maxAlignerSteps: 24,
    durationMonths: 'unlimited',
    refinements: 2,
    tsRevisions: 'unlimited',
    retainerSets: 'unlimited',
  },
  {
    id: 'eon-pro',
    code: 'EON_PRO',
    label: 'EON_PRO',
    accent: 'teal',
    description: 'Unlimited aligner steps for cases that need ongoing refinement.',
    maxAlignerSteps: 'unlimited',
    durationMonths: 36,
    refinements: 'unlimited',
    tsRevisions: 'unlimited',
    retainerSets: 2,
  },
];

const DEMO_CONFIGS: Record<DemoVersion, CaseConfig> = {
  '1.0.0': { requireXray: false, maxAttachments: 5 },
  '2.1.0': { requireXray: true, maxAttachments: 8, packages: DEMO_PACKAGES },
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
