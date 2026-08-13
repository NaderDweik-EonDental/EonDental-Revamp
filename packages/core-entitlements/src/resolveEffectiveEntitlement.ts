import semver from 'semver';
import type {
  EffectiveEntitlement,
  TenantEntitlement,
  UserEntitlement,
} from './types.js';

/**
 * Single place the entitlement cascade rule lives.
 * Pure: no fetch, no React, no side effects.
 * Every view must call this — never re-implement the cascade elsewhere.
 *
 * Every doctor belongs to a client; the tenant ceiling is always required.
 */
export function resolveEffectiveEntitlement(
  tenant: TenantEntitlement,
  user: UserEntitlement,
): EffectiveEntitlement {
  if (!tenant.enabled) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  const requested = user.assignedVersion ?? tenant.allowedVersionRange.max;
  const ceiling = tenant.allowedVersionRange.max;
  const effective = semver.gt(requested, ceiling) ? ceiling : requested;

  return { featureId: user.featureId, enabled: true, version: effective };
}
