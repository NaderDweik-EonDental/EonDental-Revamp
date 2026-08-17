import type { SmileSimulationConfig } from '../1-domain/simulationRules.js';
export type ConfigValidationResult = {
    ok: true;
    config: SmileSimulationConfig;
} | {
    ok: false;
    errors: string[];
};
export declare function validateSmileConfig(input: unknown): ConfigValidationResult;
//# sourceMappingURL=validateSmileConfig.d.ts.map