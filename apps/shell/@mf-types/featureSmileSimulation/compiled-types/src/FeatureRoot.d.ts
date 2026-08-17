import type { FeatureProps } from '@eon/core-sdk';
export type SmileSimulationFeatureConfig = {
    maxShadeOptions: number;
    allowWhiteningPreview: boolean;
};
declare function FeatureRoot({ config, entitlement, }: FeatureProps<SmileSimulationFeatureConfig>): import("react").JSX.Element;
export default FeatureRoot;
