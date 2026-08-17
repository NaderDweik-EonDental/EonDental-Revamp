import type { ToothShade } from '../1-domain/simulationRules.js';
type SmilePhotoCompareProps = {
    photoFile: File | null;
    afterImageUrl: string | null;
    processing: boolean;
    error: string | null;
    targetShade: ToothShade;
    includeWhitening: boolean;
    showShadeAndWhitening?: boolean;
};
export declare function SmilePhotoCompare({ photoFile, afterImageUrl, processing, error, targetShade, includeWhitening, showShadeAndWhitening, }: SmilePhotoCompareProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SmilePhotoCompare.d.ts.map