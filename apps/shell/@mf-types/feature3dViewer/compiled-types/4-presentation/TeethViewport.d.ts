import type { CameraPreset } from '../1-domain/viewerRules.js';
type TeethViewportProps = {
    upperFile: File | null;
    lowerFile: File | null;
    camera: CameraPreset;
    active: boolean;
    onStats?: (stats: {
        triangles: number;
    }) => void;
    onError?: (message: string) => void;
};
export declare function TeethViewport({ upperFile, lowerFile, camera, active, onStats, onError, }: TeethViewportProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=TeethViewport.d.ts.map