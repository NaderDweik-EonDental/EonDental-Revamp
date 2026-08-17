import type { FeatureProps } from '@eon/core-sdk';
import { PlannerPage } from '@/pages/planner';
import { createInMemoryPlanApi } from '@/features/submit-plan';
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

  return (
    <PlannerPage
      config={config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
