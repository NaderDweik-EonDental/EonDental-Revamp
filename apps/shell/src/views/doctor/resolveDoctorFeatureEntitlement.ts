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
  client: ClientRecord | null,
): EffectiveEntitlement {
  const assignment = doctor.assignments.find((a) => a.featureId === featureId);

  const user: UserEntitlement = {
    userId: doctor.userId,
    clientId: doctor.clientId,
    featureId,
    assignedVersion: assignment?.assignedVersion,
  };

  // Independent doctor: no client tier.
  if (doctor.clientId === null) {
    return resolveEffectiveEntitlement(null, user);
  }

  if (!client) {
    throw new Error(
      `Client ${doctor.clientId} not found for doctor ${doctor.userId}`,
    );
  }

  const record = client.entitlements.find((e) => e.featureId === featureId);
  const tenant: TenantEntitlement = record
    ? {
        clientId: client.clientId,
        featureId: record.featureId,
        enabled: record.enabled,
        allowedVersionRange: record.allowedVersionRange,
      }
    : {
        clientId: client.clientId,
        featureId,
        enabled: false,
        allowedVersionRange: { max: '0.0.0' },
      };

  return resolveEffectiveEntitlement(tenant, user);
}
