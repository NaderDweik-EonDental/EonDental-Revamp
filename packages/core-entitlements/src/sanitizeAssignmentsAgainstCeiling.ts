import type { FeatureId, TenantEntitlement } from './types.js';
import { pickAllowedVersion } from './allowedVersions.js';

export interface VersionAssignment {
  featureId: FeatureId;
  assignedVersion: string;
}

export type SanitizeAssignmentsResult =
  | { ok: true; assignments: VersionAssignment[] }
  | { ok: false; errors: string[] };

/**
 * Enforce the tenant allowed-version set on write.
 * Assignments for disabled tenant features are dropped.
 * Versions not in the allowed set are clamped to the highest allowed version.
 */
export function sanitizeAssignmentsAgainstCeiling(
  assignments: VersionAssignment[],
  tenantEntitlements: TenantEntitlement[],
): SanitizeAssignmentsResult {
  const errors: string[] = [];
  const next: VersionAssignment[] = [];

  for (const assignment of assignments) {
    const tenant = tenantEntitlements.find(
      (entry) => entry.featureId === assignment.featureId,
    );

    if (!tenant || !tenant.enabled) {
      continue;
    }

    const version = pickAllowedVersion(
      assignment.assignedVersion,
      tenant.allowedVersions,
    );
    if (!version) {
      continue;
    }

    next.push({
      featureId: assignment.featureId,
      assignedVersion: version,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, assignments: next };
}
