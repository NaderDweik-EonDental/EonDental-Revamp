import type { FeatureId } from '@eon/core-entitlements';
import clientsSeed from '../data/clients.json';
import doctorsSeed from '../data/doctors.json';
import featureCatalogSeed from '../data/feature-catalog.json';
import featureConfigsSeed from '../data/feature-configs.json';

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

export type FeatureConfigByVersion = Record<
  string,
  Record<string, Record<string, unknown>>
>;

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

/** In-memory copy of the JSON seeds. Refresh the page to reset to the files. */
export const store = {
  clients: clone(clientsSeed) as ClientRecord[],
  doctors: clone(doctorsSeed) as DoctorRecord[],
  featureCatalog: clone(featureCatalogSeed) as FeatureCatalogEntry[],
  featureConfigs: clone(featureConfigsSeed) as FeatureConfigByVersion,
};
