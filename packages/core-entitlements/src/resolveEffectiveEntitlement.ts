import type {
  EffectiveEntitlement,
  TenantEntitlement,
  UserEntitlement,
} from './types.js';
import { pickAllowedVersion } from './allowedVersions.js';

/**
 * Single place the entitlement cascade rule lives.
 * Pure: no fetch, no React, no side effects.
 * Every view must call this — never re-implement the cascade elsewhere.
 *
 * Every doctor belongs to a client; the tenant allowed-version set is always required.
 */
export function resolveEffectiveEntitlement(
  tenant: TenantEntitlement,
  user: UserEntitlement,
): EffectiveEntitlement {
  if (!tenant.enabled) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  const version = pickAllowedVersion(
    user.assignedVersion,
    tenant.allowedVersions,
  );
  if (!version) {
    return { featureId: user.featureId, enabled: false, version: null };
  }

  return { featureId: user.featureId, enabled: true, version };
}
