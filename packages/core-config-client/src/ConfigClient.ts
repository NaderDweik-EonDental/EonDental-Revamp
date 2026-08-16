import type { FeatureId } from '@eon/core-entitlements';

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

export interface ConfigClient {
  getFeatureCatalog(): Promise<FeatureCatalogEntry[]>;
  putFeatureCatalog(catalog: FeatureCatalogEntry[]): Promise<FeatureCatalogEntry[]>;
  listClients(): Promise<ClientRecord[]>;
  getClient(clientId: string): Promise<ClientRecord | null>;
  createClient(client: ClientRecord): Promise<ClientRecord>;
  putClientEntitlements(
    clientId: string,
    entitlements: ClientEntitlementRecord[],
  ): Promise<ClientRecord>;
  listDoctors(clientId?: string | null): Promise<DoctorRecord[]>;
  getDoctor(userId: string): Promise<DoctorRecord | null>;
  putDoctorAssignments(
    userId: string,
    assignments: FeatureAssignment[],
  ): Promise<DoctorRecord>;
  getFeatureConfig(
    featureId: FeatureId,
    version: string,
  ): Promise<Record<string, unknown>>;
}
