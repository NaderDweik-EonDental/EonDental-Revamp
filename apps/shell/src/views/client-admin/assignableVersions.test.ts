import { describe, expect, it } from 'vitest';
import { assignableVersionsWithinCeiling } from './assignableVersions.js';

describe('assignableVersionsWithinCeiling', () => {
  it('returns empty when the tenant feature is disabled', () => {
    expect(
      assignableVersionsWithinCeiling(['1.0.0', '2.1.0'], {
        featureId: 'case-submission',
        enabled: false,
        allowedVersions: ['2.1.0'],
      }),
    ).toEqual([]);
  });

  it('returns only the versions super-admin checked', () => {
    expect(
      assignableVersionsWithinCeiling(['1.0.0', '2.1.0', '3.0.0'], {
        featureId: 'case-submission',
        enabled: true,
        allowedVersions: ['2.1.0'],
      }),
    ).toEqual(['2.1.0']);
  });
});
