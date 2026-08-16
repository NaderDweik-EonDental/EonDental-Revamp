import type { FeatureId } from '@eon/core-entitlements';
import clientsSeed from '../data/clients.json';
import doctorsSeed from '../data/doctors.json';
import featureCatalogSeed from '../data/feature-catalog.json';

export interface FeatureAssignment {
  featureId: FeatureId;
  assignedVersion: string;
}

export interface DoctorRecord {
  userId: string;
  clientId: string;
  role: 'doctor';
  assignments: FeatureAssignment[];
}

export interface ClientEntitlementRecord {
  featureId: FeatureId;
  enabled: boolean;
  allowedVersions: string[];
}

export interface ClientRecord {
  clientId: string;
  entitlements: ClientEntitlementRecord[];
}

export interface FeatureCatalogEntry {
  featureId: FeatureId;
  versions: string[];
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

const CASE_PACKAGES = [
  {
    id: 'mov-10',
    code: "MOV' 10",
    label: "MOV' 10",
    accent: 'graphite',
    description: 'Best for mild cases like crowding, spacing, or relapse.',
    maxAlignerSteps: 10,
    durationMonths: 12,
    refinements: 1,
    tsRevisions: 2,
    retainerSets: 1,
  },
  {
    id: 'eon-basic',
    code: 'EON_BASIC',
    label: 'EON_BASIC',
    accent: 'slate',
    description: 'Best for mild cases like crowding, spacing, or relapse.',
    maxAlignerSteps: 10,
    durationMonths: 'unlimited',
    refinements: 1,
    tsRevisions: 'unlimited',
    retainerSets: 'unlimited',
  },
  {
    id: 'eon-plus',
    code: 'EON_PLUS',
    label: 'EON_PLUS',
    accent: 'emerald',
    description: 'Covers a wide range of mild to moderate cases.',
    maxAlignerSteps: 24,
    durationMonths: 'unlimited',
    refinements: 2,
    tsRevisions: 'unlimited',
    retainerSets: 'unlimited',
  },
  {
    id: 'eon-pro',
    code: 'EON_PRO',
    label: 'EON_PRO',
    accent: 'teal',
    description: 'Unlimited aligner steps for cases that need ongoing refinement.',
    maxAlignerSteps: 'unlimited',
    durationMonths: 36,
    refinements: 'unlimited',
    tsRevisions: 'unlimited',
    retainerSets: 2,
  },
];

/** Static per-version configs. Keys must match the feature catalog. */
export type FeatureConfigByVersion = Record<
  string,
  Record<string, Record<string, unknown>>
>;

/** In-memory mutable store — MSW handlers read/write this so admin edits persist for the session. */
export const store = {
  clients: clone(clientsSeed) as ClientRecord[],
  doctors: clone(doctorsSeed) as DoctorRecord[],
  featureCatalog: clone(featureCatalogSeed) as FeatureCatalogEntry[],
  featureConfigs: {
    'case-submission': {
      '1.0.0': { requireXray: false, maxAttachments: 5 },
      '2.1.0': {
        requireXray: true,
        maxAttachments: 8,
        packages: CASE_PACKAGES,
      },
    },
    'smile-simulation': {
      '1.0.0': { maxShadeOptions: 0, allowWhiteningPreview: false },
      '1.4.0': { maxShadeOptions: 3, allowWhiteningPreview: true },
    },
    '3d-viewer': {
      '1.0.0': { allowedFormats: ['stl'], defaultCamera: 'front' },
      '1.3.1': { allowedFormats: ['stl', 'ply'], defaultCamera: 'front' },
    },
  } as FeatureConfigByVersion,
};
