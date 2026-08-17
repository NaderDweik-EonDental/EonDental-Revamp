import type { FeatureProps } from '@eon/core-sdk';
import { PlannerPage } from '@/pages/planner';
import { createInMemoryPlanApi } from '@/features/submit-plan';
import { validatePlanConfig } from '@/shared/config';
import type { PlanConfig } from '@/entities/treatment-plan';

export type TreatmentPlanFeatureConfig = PlanConfig;

const api = createInMemoryPlanApi();

function FeatureRoot({
  config,
  entitlement,
}: FeatureProps<TreatmentPlanFeatureConfig>) {
  if (!entitlement.enabled) {
    return (
      <div role="status" style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
        Treatment plan is not enabled for this user.
      </div>
    );
  }

  const validated = validatePlanConfig(config);
  if (!validated.ok) {
    return (
      <div role="alert" style={{ padding: '1.5rem', color: '#9b1c1c' }}>
        <strong>Invalid treatment-plan config</strong>
        <ul>
          {validated.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <PlannerPage
      config={validated.config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
