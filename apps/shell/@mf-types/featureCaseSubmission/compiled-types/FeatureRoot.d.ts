import type { FeatureProps } from '@eon/core-sdk';
export type CaseSubmissionConfig = {
    requireXray: boolean;
    maxAttachments: number;
};
declare function FeatureRoot({ config, entitlement, }: FeatureProps<CaseSubmissionConfig>): import("react").JSX.Element;
export default FeatureRoot;
//# sourceMappingURL=FeatureRoot.d.ts.map