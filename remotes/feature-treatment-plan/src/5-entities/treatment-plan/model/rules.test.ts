import { describe, expect, it } from 'vitest';
import { estimateVisitWeeks, isValidPlan } from './rules.js';
import type { PlanConfig, PlanDraft } from './types.js';

const config: PlanConfig = { maxStages: 3, allowVisitEstimate: false };

const validDraft: PlanDraft = {
  patientId: 'PT-100',
  stages: [
    { id: 's1', kind: 'records' },
    { id: 's2', kind: 'aligners' },
  ],
};

describe('isValidPlan', () => {
  it('accepts a named patient with unique stages under the cap', () => {
    expect(isValidPlan(validDraft, config)).toEqual({ valid: true });
  });

  it('requires a patient id', () => {
    const result = isValidPlan({ ...validDraft, patientId: '  ' }, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('patientId is required');
    }
  });

  it('requires at least one stage', () => {
    const result = isValidPlan({ ...validDraft, stages: [] }, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('at least one stage is required');
    }
  });

  it('rejects more stages than the config allows', () => {
    const result = isValidPlan(
      {
        ...validDraft,
        stages: [
          { id: 's1', kind: 'records' },
          { id: 's2', kind: 'ipr' },
          { id: 's3', kind: 'attachments' },
          { id: 's4', kind: 'aligners' },
        ],
      },
      config,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate stage kinds', () => {
    const result = isValidPlan(
      {
        ...validDraft,
        stages: [
          { id: 's1', kind: 'aligners' },
          { id: 's2', kind: 'aligners' },
        ],
      },
      config,
    );
    expect(result.valid).toBe(false);
  });
});

describe('estimateVisitWeeks', () => {
  it('sums catalog weeks for the chosen stages', () => {
    expect(estimateVisitWeeks(validDraft)).toBe(9);
  });
});
