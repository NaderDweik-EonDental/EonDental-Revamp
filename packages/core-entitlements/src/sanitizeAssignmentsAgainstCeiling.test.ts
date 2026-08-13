import { describe, expect, it } from 'vitest';
import { sanitizeAssignmentsAgainstCeiling } from './sanitizeAssignmentsAgainstCeiling.js';
import type { TenantEntitlement } from './types.js';

const ceilings: TenantEntitlement[] = [
  {
    clientId: 'eon-dental',
    featureId: 'case-submission',
    enabled: true,
    allowedVersionRange: { max: '2.1.0' },
  },
  {
    clientId: 'eon-dental',
    featureId: 'smile-simulation',
    enabled: false,
    allowedVersionRange: { max: '1.4.0' },
  },
];

describe('sanitizeAssignmentsAgainstCeiling', () => {
  it('clamps versions above the ceiling', () => {
    const result = sanitizeAssignmentsAgainstCeiling(
      [{ featureId: 'case-submission', assignedVersion: '9.9.9' }],
      ceilings,
    );
    expect(result).toEqual({
      ok: true,
      assignments: [
        { featureId: 'case-submission', assignedVersion: '2.1.0' },
      ],
    });
  });

  it('drops assignments for disabled tenant features', () => {
    const result = sanitizeAssignmentsAgainstCeiling(
      [
        { featureId: 'case-submission', assignedVersion: '2.1.0' },
        { featureId: 'smile-simulation', assignedVersion: '1.4.0' },
      ],
      ceilings,
    );
    expect(result).toEqual({
      ok: true,
      assignments: [
        { featureId: 'case-submission', assignedVersion: '2.1.0' },
      ],
    });
  });
});
