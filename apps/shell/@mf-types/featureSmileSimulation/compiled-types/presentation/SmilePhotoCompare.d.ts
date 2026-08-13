import type { ToothShade } from '../domain/simulationRules.js';
type SmilePhotoCompareProps = {
    photoFile: File | null;
    afterImageUrl: string | null;
    processing: boolean;
    error: string | null;
    targetShade: ToothShade;
    includeWhitening: boolean;
    aiReady: boolean;
};
export declare function SmilePhotoCompare({ photoFile, afterImageUrl, processing, error, targetShade, includeWhitening, aiReady, }: SmilePhotoCompareProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SmilePhotoCompare.d.ts.map