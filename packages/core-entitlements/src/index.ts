export type {
  EffectiveEntitlement,
  FeatureId,
  TenantEntitlement,
  UserEntitlement,
} from './types.js';
export { resolveEffectiveEntitlement } from './resolveEffectiveEntitlement.js';
export {
  highestAllowedVersion,
  pickAllowedVersion,
} from './allowedVersions.js';
export {
  sanitizeAssignmentsAgainstCeiling,
  type SanitizeAssignmentsResult,
  type VersionAssignment,
} from './sanitizeAssignmentsAgainstCeiling.js';
