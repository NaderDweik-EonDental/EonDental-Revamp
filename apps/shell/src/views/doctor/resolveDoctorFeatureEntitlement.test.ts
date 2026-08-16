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
      allowedVersions: ['1.0.0', '2.1.0'],
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
          allowedVersions: ['1.0.0', '2.1.0'],
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

  it('clamps an assignment that is not in the allowed set', () => {
    const lowCeiling: ClientRecord = {
      ...client,
      entitlements: [
        {
          featureId: 'case-submission',
          enabled: true,
          allowedVersions: ['1.0.0'],
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

  it('defaults an unassigned tenant doctor to the highest allowed version', () => {
    const unassigned: DoctorRecord = {
      ...tenantDoctor,
      assignments: [],
    };

    expect(
      resolveDoctorFeatureEntitlement('case-submission', unassigned, client),
    ).toEqual({
      featureId: 'case-submission',
      enabled: true,
      version: '2.1.0',
    });
  });
});
