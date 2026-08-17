import { type PlanDraft, type StageKind } from '../../../5-entities/treatment-plan/index.js';
export declare function emptyPlanDraft(): PlanDraft;
export declare function setPatientId(draft: PlanDraft, patientId: string): PlanDraft;
export declare function addStage(draft: PlanDraft, kind: StageKind, maxStages: number): PlanDraft;
export declare function removeStage(draft: PlanDraft, stageId: string): PlanDraft;
export declare function availableStageKinds(draft: PlanDraft): StageKind[];
