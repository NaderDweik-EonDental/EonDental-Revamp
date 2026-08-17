import type { FeatureProps } from '@eon/core-sdk';
import type { CaseConfig } from './1-domain/caseRules.js';
import { CaseSubmissionScreen } from './4-presentation/CaseSubmissionScreen.js';
import { createInMemoryCaseApi } from './3-infrastructure/caseApiClient.js';

const api = createInMemoryCaseApi();

function FeatureRoot({ config, entitlement }: FeatureProps<CaseConfig>) {
  if (!entitlement.enabled) {
    return (
      <div role="status" style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
        Case submission is not enabled for this user.
      </div>
    );
  }

  return (
    <CaseSubmissionScreen
      config={config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
