import { describe, expect, it, vi } from 'vitest';
import type { PlanApi } from '../api/in-memory-plan-api.js';
import type { PlanConfig, PlanDraft } from '@/entities/treatment-plan';
import { submitPlan } from './submitPlan.js';

const config: PlanConfig = { maxStages: 3, allowVisitEstimate: true };

const validDraft: PlanDraft = {
  patientId: 'PT-100',
  stages: [{ id: 's1', kind: 'aligners' }],
};

function fakeApi(): PlanApi {
  return {
    submit: vi.fn(async (draft) => ({
      planId: 'plan_1',
      patientId: draft.patientId,
      submittedAt: '2026-08-17T00:00:00.000Z',
    })),
  };
}

describe('submitPlan', () => {
  it('rejects invalid drafts without calling the API', async () => {
    const api = fakeApi();
    const result = await submitPlan({ ...validDraft, patientId: '' }, config, api);

    expect(result.ok).toBe(false);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('submits a valid plan through the API', async () => {
    const api = fakeApi();
    const result = await submitPlan(validDraft, config, api);

    expect(api.submit).toHaveBeenCalledWith(validDraft);
    expect(result).toEqual({
      ok: true,
      plan: {
        planId: 'plan_1',
        patientId: 'PT-100',
        submittedAt: '2026-08-17T00:00:00.000Z',
      },
    });
  });
});
