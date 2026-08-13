import { describe, expect, it } from 'vitest';
import type { ClientRecord, DoctorRecord } from '@eon/core-config-client';
import { resolveDoctorFeatureEntitlement } from './resolveDoctorFeatureEntitlement.js';

const tenantDoctor: DoctorRecord = {
  userId: 'doc_123',
  clientId: 'eon-dental',
  role: 'doctor',
  assignments: [
    { featureId: 'case-submission', assignedVersion: '2.1.0' },
  ],
};

const client: ClientRecord = {
  clientId: 'eon-dental',
  entitlements: [
    {
      featureId: 'case-submission',
      enabled: true,
      allowedVersionRange: { max: '2.1.0' },
    },
  ],
};

describe('resolveDoctorFeatureEntitlement', () => {
  it('resolves an enabled tenant doctor to their assigned version', () => {
    expect(
      resolveDoctorFeatureEntitlement('case-submission', tenantDoctor, client),
    ).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '2.1.0',
    });
  });

  it('disables when the tenant ceiling is disabled', () => {
    const disabledClient: ClientRecord = {
      ...client,
      entitlements: [
        {
          featureId: 'case-submission',
          enabled: false,
          allowedVersionRange: { max: '2.1.0' },
        },
      ],
    };

    expect(
      resolveDoctorFeatureEntitlement(
        'case-submission',
        tenantDoctor,
        disabledClient,
      ),
    ).toEqual({
      featureId: 'case-submission',
      enabled: false,
      version: null,
    });
  });

  it('clamps an assignment above the tenant ceiling', () => {
    const lowCeiling: ClientRecord = {
      ...client,
      entitlements: [
        {
          featureId: 'case-submission',
          enabled: true,
          allowedVersionRange: { max: '1.0.0' },
        },
      ],
    };

    expect(
      resolveDoctorFeatureEntitlement(
        'case-submission',
        tenantDoctor,
        lowCeiling,
      ),
    ).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });

  it('resolves an independent doctor with no tenant record', () => {
    const independent: DoctorRecord = {
      userId: 'doc_456',
      clientId: null,
      role: 'doctor',
      assignments: [
        { featureId: 'case-submission', assignedVersion: '1.0.0' },
      ],
    };

    expect(
      resolveDoctorFeatureEntitlement('case-submission', independent, null),
    ).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '1.0.0',
    });
  });
});
