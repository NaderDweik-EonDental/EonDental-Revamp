import type { FeatureProps } from '@eon/core-sdk';
import { SmileSimulationScreen } from './4-presentation/SmileSimulationScreen.js';
import { createInMemorySmileApi } from './3-infrastructure/smileApiClient.js';

export type SmileSimulationFeatureConfig = {
  maxShadeOptions: number;
  allowWhiteningPreview: boolean;
};

const api = createInMemorySmileApi();

function FeatureRoot({
  config,
  entitlement,
}: FeatureProps<SmileSimulationFeatureConfig>) {
  if (!entitlement.enabled) {
    return (
      <div role="status" style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
        Smile simulation is not enabled for this user.
      </div>
    );
  }

  return (
    <SmileSimulationScreen
      config={config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
