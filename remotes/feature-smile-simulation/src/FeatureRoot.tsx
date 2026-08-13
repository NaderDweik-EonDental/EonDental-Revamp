import type { FeatureProps } from '@eon/core-sdk';
import { SmileSimulationScreen } from './presentation/SmileSimulationScreen.js';
import { createInMemorySmileApi } from './infrastructure/smileApiClient.js';
import { validateSmileConfig } from './infrastructure/validateSmileConfig.js';

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

  const validated = validateSmileConfig(config);
  if (!validated.ok) {
    return (
      <div role="alert" style={{ padding: '1.5rem', color: '#9b1c1c' }}>
        <strong>Invalid smile-simulation config</strong>
        <ul>
          {validated.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <SmileSimulationScreen
      config={validated.config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
