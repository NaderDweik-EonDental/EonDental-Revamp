import semver from 'semver';
import type { FeatureId } from '@eon/core-entitlements';
import type { ClientEntitlementRecord } from '@eon/core-config-client';

/** Versions a client admin may assign for a feature, given the tenant ceiling. */
export function assignableVersionsWithinCeiling(
  catalogVersions: string[],
  entitlement: ClientEntitlementRecord | undefined,
): string[] {
  if (!entitlement?.enabled) {
    return [];
  }
  const ceiling = entitlement.allowedVersionRange.max;
  return catalogVersions
    .filter((version) => semver.valid(version) && !semver.gt(version, ceiling))
    .sort(semver.compare);
}

export function entitlementForFeature(
  entitlements: ClientEntitlementRecord[],
  featureId: FeatureId,
): ClientEntitlementRecord | undefined {
  return entitlements.find((e) => e.featureId === featureId);
}
