import type { FeatureProps } from '@eon/core-sdk';
import type { PlanConfig } from '../5-entities/treatment-plan/index.js';
export type TreatmentPlanFeatureConfig = PlanConfig;
declare function FeatureRoot({ config, entitlement, }: FeatureProps<TreatmentPlanFeatureConfig>): import("react").JSX.Element;
export default FeatureRoot;
