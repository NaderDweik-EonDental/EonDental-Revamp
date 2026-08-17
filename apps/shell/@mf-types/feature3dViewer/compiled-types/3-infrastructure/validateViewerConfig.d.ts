import type { ViewerConfig } from '../1-domain/viewerRules.js';
export type ConfigValidationResult = {
    ok: true;
    config: ViewerConfig;
} | {
    ok: false;
    errors: string[];
};
export declare function validateViewerConfig(input: unknown): ConfigValidationResult;
