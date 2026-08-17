import type { PlanConfig, PlanDraft, PlanValidationResult, StageDefinition, StageKind } from './types.js';
export declare const STAGE_CATALOG: StageDefinition[];
export declare function stageDefinition(kind: StageKind): StageDefinition;
export declare function hasVisitEstimate(config: PlanConfig): boolean;
export declare function estimateVisitWeeks(draft: PlanDraft): number;
export declare function isValidPlan(draft: PlanDraft, config: PlanConfig): PlanValidationResult;
//# sourceMappingURL=rules.d.ts.map