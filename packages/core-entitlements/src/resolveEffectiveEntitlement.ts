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
 */
export function resolveEffectiveEntitlement(
  tenant: TenantEntitlement | null,
  user: UserEntitlement,
): EffectiveEntitlement {
  // Independent doctor: no client tier, no ceiling to clamp against.
  if (tenant === null) {
    if (!user.assignedVersion) {
      return { featureId: user.featureId, enabled: false, version: null };
    }
    return {
      featureId: user.featureId,
      enabled: true,
      version: user.assignedVersion,
    };
  }

  if (!tenant.enabled) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  const requested = user.assignedVersion ?? tenant.allowedVersionRange.max;
  const ceiling = tenant.allowedVersionRange.max;
  const effective = semver.gt(requested, ceiling) ? ceiling : requested;

  return { featureId: user.featureId, enabled: true, version: effective };
}
