export type ModelFormat = 'stl' | 'ply' | 'obj';
export type CameraPreset = 'front' | 'occlusal' | 'lateral';
export type ArchRole = 'upper' | 'lower';
export interface ViewerLoadRequest {
    upperModelName: string;
    lowerModelName: string;
    format: ModelFormat;
    camera: CameraPreset;
}
export interface ViewerConfig {
    allowedFormats: string[];
    defaultCamera: CameraPreset;
}
export type ViewerValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: string[];
};
export declare function isAllowedFormat(format: string, config: ViewerConfig): format is ModelFormat;
export declare function isValidViewerRequest(request: ViewerLoadRequest, config: ViewerConfig): ViewerValidationResult;
//# sourceMappingURL=viewerRules.d.ts.map