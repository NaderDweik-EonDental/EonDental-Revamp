import { describe, expect, it } from 'vitest';
import { assignableVersionsWithinCeiling } from './assignableVersions.js';

describe('assignableVersionsWithinCeiling', () => {
  it('returns empty when the tenant feature is disabled', () => {
    expect(
      assignableVersionsWithinCeiling(['1.0.0', '2.1.0'], {
        featureId: 'case-submission',
        enabled: false,
        allowedVersionRange: { max: '2.1.0' },
      }),
    ).toEqual([]);
  });

  it('filters out versions above the ceiling', () => {
    expect(
      assignableVersionsWithinCeiling(['1.0.0', '2.1.0', '3.0.0'], {
        featureId: 'case-submission',
        enabled: true,
        allowedVersionRange: { max: '2.1.0' },
      }),
    ).toEqual(['1.0.0', '2.1.0']);
  });
});
