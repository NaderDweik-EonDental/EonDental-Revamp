import { isValidPlan, type PlanConfig, type PlanDraft } from '@/entities/treatment-plan';
import type { PlanApi, SubmittedPlan } from '../api/in-memory-plan-api.js';

export type SubmitPlanResult =
  | { ok: true; plan: SubmittedPlan }
  | { ok: false; errors: string[] };

export async function submitPlan(
  draft: PlanDraft,
  config: PlanConfig,
  api: PlanApi,
): Promise<SubmitPlanResult> {
  const validation = isValidPlan(draft, config);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const plan = await api.submit(draft);
  return { ok: true, plan };
}
