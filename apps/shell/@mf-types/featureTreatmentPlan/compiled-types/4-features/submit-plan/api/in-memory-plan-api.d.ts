import type { PlanDraft } from '@/entities/treatment-plan';
export interface SubmittedPlan {
    planId: string;
    patientId: string;
    submittedAt: string;
}
export interface PlanApi {
    submit(draft: PlanDraft): Promise<SubmittedPlan>;
}
export declare function createInMemoryPlanApi(): PlanApi;
//# sourceMappingURL=in-memory-plan-api.d.ts.map