import type { PlanDraft, StageKind } from '@/entities/treatment-plan';
export declare function emptyPlanDraft(): PlanDraft;
export declare function setPatientId(draft: PlanDraft, patientId: string): PlanDraft;
export declare function addStage(draft: PlanDraft, kind: StageKind, maxStages: number): PlanDraft;
export declare function removeStage(draft: PlanDraft, stageId: string): PlanDraft;
export declare function availableStageKinds(draft: PlanDraft): StageKind[];
//# sourceMappingURL=draft.d.ts.map