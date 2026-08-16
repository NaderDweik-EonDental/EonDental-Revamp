import {
  resolveEffectiveEntitlement,
  type EffectiveEntitlement,
  type FeatureId,
  type TenantEntitlement,
  type UserEntitlement,
} from '@eon/core-entitlements';
import type {
  ClientRecord,
  DoctorRecord,
} from '@eon/core-config-client';

/**
 * Map config-api records into the entitlement cascade.
 * Cascade logic itself lives only in resolveEffectiveEntitlement.
 */
export function resolveDoctorFeatureEntitlement(
  featureId: FeatureId,
  doctor: DoctorRecord,
  client: ClientRecord,
): EffectiveEntitlement {
  const assignment = doctor.assignments.find((a) => a.featureId === featureId);

  const user: UserEntitlement = {
    userId: doctor.userId,
    clientId: doctor.clientId,
    featureId,
    assignedVersion: assignment?.assignedVersion,
  };

  const record = client.entitlements.find((e) => e.featureId === featureId);
  const tenant: TenantEntitlement = record
    ? {
        clientId: client.clientId,
        featureId: record.featureId,
        enabled: record.enabled,
        allowedVersions: record.allowedVersions,
      }
    : {
        clientId: client.clientId,
        featureId,
        enabled: false,
        allowedVersions: [],
      };

  return resolveEffectiveEntitlement(tenant, user);
}
