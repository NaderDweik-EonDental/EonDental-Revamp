import type { FeatureProps } from '@eon/core-sdk';
import type { CameraPreset } from './1-domain/viewerRules.js';
export type ViewerFeatureConfig = {
    allowedFormats: string[];
    defaultCamera: CameraPreset;
};
declare function FeatureRoot({ config, entitlement, }: FeatureProps<ViewerFeatureConfig>): import("react").JSX.Element;
export default FeatureRoot;
//# sourceMappingURL=FeatureRoot.d.ts.map