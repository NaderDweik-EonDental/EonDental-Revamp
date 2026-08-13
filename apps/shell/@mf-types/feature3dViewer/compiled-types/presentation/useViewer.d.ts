import { type LoadModelResult, type ViewerApi } from '../application/loadModel.js';
import type { CameraPreset, ModelFormat, ViewerConfig, ViewerLoadRequest } from '../domain/viewerRules.js';
export type ArchFiles = {
    upper: File | null;
    lower: File | null;
};
export declare function useViewer(args: {
    config: ViewerConfig;
    api: ViewerApi;
}): {
    request: ViewerLoadRequest;
    files: ArchFiles;
    setUpperModel: (file: File | null, fallbackName?: string) => void;
    setLowerModel: (file: File | null, fallbackName?: string) => void;
    setFormat: (format: ModelFormat) => void;
    setCamera: (camera: CameraPreset) => void;
    loading: boolean;
    lastResult: LoadModelResult | null;
    meshReady: boolean;
    setMeshReady: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    load: () => Promise<LoadModelResult>;
};
//# sourceMappingURL=useViewer.d.ts.map