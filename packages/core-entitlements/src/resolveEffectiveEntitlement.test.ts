import { describe, expect, it } from 'vitest';
import { resolveEffectiveEntitlement } from './resolveEffectiveEntitlement.js';
import type { TenantEntitlement, UserEntitlement } from './types.js';

const tenant = (
  overrides: Partial<TenantEntitlement> = {},
): TenantEntitlement => ({
  clientId: 'eon-dental',
  featureId: 'case-submission',
  enabled: true,
  allowedVersionRange: { max: '2.1.0' },
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

  it('returns disabled for an independent doctor with no assignment', () => {
    const result = resolveEffectiveEntitlement(
      null,
      user({ clientId: null, assignedVersion: undefined }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: false,
      version: null,
    });
  });

  it('returns the assigned version for an independent doctor with an assignment', () => {
    const result = resolveEffectiveEntitlement(
      null,
      user({ clientId: null, assignedVersion: '1.0.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });

  it('clamps to the ceiling when a doctor is assigned above it', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersionRange: { max: '2.0.0' } }),
      user({ assignedVersion: '2.1.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '2.0.0',
    });
  });

  it('keeps the doctor version when assigned below the ceiling', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersionRange: { max: '2.1.0' } }),
      user({ assignedVersion: '1.0.0' }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });

  it('defaults to the ceiling max when a doctor has no assignment', () => {
    const result = resolveEffectiveEntitlement(
      tenant({ allowedVersionRange: { max: '2.1.0' } }),
      user({ assignedVersion: undefined }),
    );

    expect(result).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '2.1.0',
    });
  });
});
