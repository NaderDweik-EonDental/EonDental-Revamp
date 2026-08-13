import type { FeatureProps } from '@eon/core-sdk';
import { CaseSubmissionScreen } from './presentation/CaseSubmissionScreen.js';
import { createInMemoryCaseApi } from './infrastructure/caseApiClient.js';
import { validateCaseConfig } from './infrastructure/validateCaseConfig.js';

export type CaseSubmissionConfig = {
  requireXray: boolean;
  maxAttachments: number;
};

const api = createInMemoryCaseApi();

function FeatureRoot({
  config,
  entitlement,
}: FeatureProps<CaseSubmissionConfig>) {
  if (!entitlement.enabled) {
    return (
      <div role="status" style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
        Case submission is not enabled for this user.
      </div>
    );
  }

  const validated = validateCaseConfig(config);
  if (!validated.ok) {
    return (
      <div
        role="alert"
        style={{
          padding: '1.5rem',
          fontFamily: 'sans-serif',
          color: '#9b1c1c',
        }}
      >
        <strong>Invalid case-submission config</strong>
        <ul>
          {validated.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <CaseSubmissionScreen
      config={validated.config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
