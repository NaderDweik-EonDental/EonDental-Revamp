import semver from 'semver';
import {
  highestAllowedVersion,
  type FeatureId,
} from '@eon/core-entitlements';
import type { ClientEntitlementRecord } from '@eon/core-config-client';

/** Versions a client admin may assign — only those super-admin checked. */
export function assignableVersionsWithinCeiling(
  catalogVersions: string[],
  entitlement: ClientEntitlementRecord | undefined,
): string[] {
  if (!isFeatureOffered(entitlement)) {
    return [];
  }
  const allowed = new Set(entitlement.allowedVersions);
  return catalogVersions
    .filter((version) => allowed.has(version) && semver.valid(version))
    .sort(semver.compare);
}

export function isFeatureOffered(
  entitlement: ClientEntitlementRecord | undefined,
): entitlement is ClientEntitlementRecord {
  return Boolean(entitlement?.enabled && entitlement.allowedVersions.length > 0);
}

export function defaultAssignedVersion(
  entitlement: ClientEntitlementRecord | undefined,
): string | null {
  if (!isFeatureOffered(entitlement)) {
    return null;
  }
  return highestAllowedVersion(entitlement.allowedVersions);
}

export function entitlementForFeature(
  entitlements: ClientEntitlementRecord[],
  featureId: FeatureId,
): ClientEntitlementRecord | undefined {
  return entitlements.find((e) => e.featureId === featureId);
}
