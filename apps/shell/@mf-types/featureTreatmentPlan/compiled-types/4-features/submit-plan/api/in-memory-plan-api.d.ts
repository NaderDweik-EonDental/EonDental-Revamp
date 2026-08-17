import type { PlanDraft } from '../../../5-entities/treatment-plan/index.js';
export interface SubmittedPlan {
    planId: string;
    patientId: string;
    submittedAt: string;
}
export interface PlanApi {
    submit(draft: PlanDraft): Promise<SubmittedPlan>;
}
export declare function createInMemoryPlanApi(): PlanApi;
