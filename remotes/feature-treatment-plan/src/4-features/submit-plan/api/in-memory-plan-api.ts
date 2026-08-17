import type { PlanDraft } from '@/entities/treatment-plan';

export interface SubmittedPlan {
  planId: string;
  patientId: string;
  submittedAt: string;
}

export interface PlanApi {
  submit(draft: PlanDraft): Promise<SubmittedPlan>;
}

export function createInMemoryPlanApi(): PlanApi {
  let sequence = 0;
  return {
    async submit(draft) {
      sequence += 1;
      return {
        planId: `plan_${sequence}`,
        patientId: draft.patientId,
        submittedAt: new Date().toISOString(),
      };
    },
  };
}
