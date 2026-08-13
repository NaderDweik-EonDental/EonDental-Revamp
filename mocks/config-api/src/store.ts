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
  allowedVersionRange: { min?: string; max: string };
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

/** In-memory mutable store — MSW handlers read/write this so admin edits persist for the session. */
export const store = {
  clients: clone(clientsSeed) as ClientRecord[],
  doctors: clone(doctorsSeed) as DoctorRecord[],
  featureCatalog: clone(featureCatalogSeed) as FeatureCatalogEntry[],
  featureConfigs: {
    'case-submission': {
      requireXray: true,
      maxAttachments: 8,
      packages: [
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
      ],
    },
    'smile-simulation': {
      maxShadeOptions: 3,
      allowWhiteningPreview: true,
    },
    '3d-viewer': {
      allowedFormats: ['stl', 'ply'],
      defaultCamera: 'front',
    },
  } as Record<string, Record<string, unknown>>,
};
