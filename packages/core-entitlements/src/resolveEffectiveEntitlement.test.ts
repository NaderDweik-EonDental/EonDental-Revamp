import { describe, expect, it } from 'vitest';
import { resolveEffectiveEntitlement } from './resolveEffectiveEntitlement.js';
import type { TenantEntitlement, UserEntitlement } from './types.js';

const tenant = (
  overrides: Partial<TenantEntitlement> = {},
): TenantEntitlement => ({
  clientId: 'eon-dental',
  featureId: 'case-submission',
  enabled: true,
  allowedVersions: ['1.0.0', '2.1.0'],
  ...overrides,
});

const user = (overrides: Partial<UserEntitlement> = {}): UserEntitlement => ({
  userId: 'doc_123',
  clientId: 'eon-dental',
  featureId: 'case-submission',
  ...overrides,
});

describe('resolveEffectiveEntitlement', () => {
  it('returns disabled when the tenant entitlement is disabled', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ enabled: false }),
      user({ assignedVersion: '2.1.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: false,
      version: null,
    });
  });

  it('clamps to an allowed version when the assignment is not in the set', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersions: ['1.0.0'] }),
      user({ assignedVersion: '2.1.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });

  it('keeps the doctor version when it is in the allowed set', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersions: ['1.0.0', '2.1.0'] }),
      user({ assignedVersion: '1.0.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });

  it('defaults to the highest allowed version when a doctor has no assignment', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersions: ['1.0.0', '2.1.0'] }),
      user({ assignedVersion: undefined }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '2.1.0',
    });
  });

  it('returns disabled when no versions are allowed', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersions: [] }),
      user({ assignedVersion: '2.1.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: false,
      version: null,
    });
  });
});
