import type { CaseConfig } from '../domain/caseRules.js';
export type ConfigValidationResult = {
    ok: true;
    config: CaseConfig;
} | {
    ok: false;
    errors: string[];
};
/**
 * Validate feature config at the federation boundary before it reaches presentation.
 * Fail loud on bad/stale client config.
 */
export declare function validateCaseConfig(input: unknown): ConfigValidationResult;
//# sourceMappingURL=validateCaseConfig.d.ts.map