export type ParsedPlanConfig = {
    maxStages: number;
    allowVisitEstimate: boolean;
};
export type ConfigValidationResult = {
    ok: true;
    config: ParsedPlanConfig;
} | {
    ok: false;
    errors: string[];
};
export declare function validatePlanConfig(input: unknown): ConfigValidationResult;
//# sourceMappingURL=validate.d.ts.map