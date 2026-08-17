import { type PlanConfig, type PlanDraft } from '../../../5-entities/treatment-plan/index.js';
import type { PlanApi, SubmittedPlan } from '../api/in-memory-plan-api.js';
export type SubmitPlanResult = {
    ok: true;
    plan: SubmittedPlan;
} | {
    ok: false;
    errors: string[];
};
export declare function submitPlan(draft: PlanDraft, config: PlanConfig, api: PlanApi): Promise<SubmitPlanResult>;
