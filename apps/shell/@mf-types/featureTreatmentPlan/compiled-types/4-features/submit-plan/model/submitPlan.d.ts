import { type PlanConfig, type PlanDraft } from '@/entities/treatment-plan';
import type { PlanApi, SubmittedPlan } from '../api/in-memory-plan-api.js';
export type SubmitPlanResult = {
    ok: true;
    plan: SubmittedPlan;
} | {
    ok: false;
    errors: string[];
};
export declare function submitPlan(draft: PlanDraft, config: PlanConfig, api: PlanApi): Promise<SubmitPlanResult>;
//# sourceMappingURL=submitPlan.d.ts.map