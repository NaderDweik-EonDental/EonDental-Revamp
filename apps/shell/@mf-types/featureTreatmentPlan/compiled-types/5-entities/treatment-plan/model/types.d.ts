export type StageKind = 'records' | 'ipr' | 'attachments' | 'aligners' | 'retainers';
export interface PlanStage {
    id: string;
    kind: StageKind;
}
export interface PlanDraft {
    patientId: string;
    stages: PlanStage[];
}
export interface PlanConfig {
    maxStages: number;
    allowVisitEstimate: boolean;
}
export type PlanValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: string[];
};
export interface StageDefinition {
    kind: StageKind;
    label: string;
    summary: string;
    weeks: number;
}
//# sourceMappingURL=types.d.ts.map