import semver from 'semver';
import type { FeatureId, TenantEntitlement } from './types.js';

export interface VersionAssignment {
  featureId: FeatureId;
  assignedVersion: string;
}

export type SanitizeAssignmentsResult =
  | { ok: true; assignments: VersionAssignment[] }
  | { ok: false; errors: string[] };

/**
 * Enforce tenant ceiling on write (same rule the resolver applies on read).
 * Assignments for disabled tenant features are dropped.
 * Versions above the ceiling are clamped down to the ceiling max.
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

    if (!semver.valid(assignment.assignedVersion)) {
      errors.push(
        `${assignment.featureId}: invalid version ${assignment.assignedVersion}`,
      );
      continue;
    }

    const ceiling = tenant.allowedVersionRange.max;
    const version = semver.gt(assignment.assignedVersion, ceiling)
      ? ceiling
      : assignment.assignedVersion;

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
