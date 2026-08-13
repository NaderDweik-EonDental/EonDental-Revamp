export type ToothShade = 'A1' | 'A2' | 'A3' | 'B1' | 'B2';
export interface SmileSimulationDraft {
    patientId: string;
    sourcePhotoName: string;
    targetShade: ToothShade;
    includeWhiteningPreview: boolean;
}
export interface SmileSimulationConfig {
    maxShadeOptions: number;
    allowWhiteningPreview: boolean;
}
export type SmileValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: string[];
};
export declare function availableShadesFor(config: SmileSimulationConfig): ToothShade[];
export declare function isValidSimulation(draft: SmileSimulationDraft, config: SmileSimulationConfig): SmileValidationResult;
//# sourceMappingURL=simulationRules.d.ts.map