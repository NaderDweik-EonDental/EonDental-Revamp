import type { FeatureId } from '@eon/core-entitlements';
import clientsSeed from '@eon/mocks-config-api/data/clients.json';
import doctorsSeed from '@eon/mocks-config-api/data/doctors.json';
import featureCatalogSeed from '@eon/mocks-config-api/data/feature-catalog.json';
import featureConfigsSeed from '@eon/mocks-config-api/data/feature-configs.json';
import type {
  ClientEntitlementRecord,
  ClientRecord,
  ConfigClient,
  DoctorRecord,
  FeatureAssignment,
  FeatureCatalogEntry,
} from './ConfigClient.js';

type FeatureConfigByVersion = Record<
  string,
  Record<string, Record<string, unknown>>
>;

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

/**
 * In-memory ConfigClient seeded from mocks/config-api/data/*.json.
 * Writes last until reload. No HTTP / MSW.
 */
export class MockConfigClient implements ConfigClient {
  private readonly clients: ClientRecord[];
  private readonly doctors: DoctorRecord[];
  private readonly featureCatalog: FeatureCatalogEntry[];
  private readonly featureConfigs: FeatureConfigByVersion;

  constructor() {
    this.clients = clone(clientsSeed) as ClientRecord[];
    this.doctors = clone(doctorsSeed) as DoctorRecord[];
    this.featureCatalog = clone(featureCatalogSeed) as FeatureCatalogEntry[];
    this.featureConfigs = clone(featureConfigsSeed) as FeatureConfigByVersion;
  }

  async getFeatureCatalog(): Promise<FeatureCatalogEntry[]> {
    return this.featureCatalog;
  }

  async listClients(): Promise<ClientRecord[]> {
    return this.clients;
  }

  async getClient(clientId: string): Promise<ClientRecord | null> {
    return this.clients.find((c) => c.clientId === clientId) ?? null;
  }

  async createClient(client: ClientRecord): Promise<ClientRecord> {
    if (this.clients.some((c) => c.clientId === client.clientId)) {
      throw new Error('Client already exists');
    }
    this.clients.push(client);
    return client;
  }

  async putClientEntitlements(
    clientId: string,
    entitlements: ClientEntitlementRecord[],
  ): Promise<ClientRecord> {
    const client = this.clients.find((c) => c.clientId === clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    client.entitlements = entitlements;
    return client;
  }

  async listDoctors(clientId?: string | null): Promise<DoctorRecord[]> {
    if (clientId === undefined || clientId === null) {
      return this.doctors;
    }
    return this.doctors.filter((d) => d.clientId === clientId);
  }

  async getDoctor(userId: string): Promise<DoctorRecord | null> {
    return this.doctors.find((d) => d.userId === userId) ?? null;
  }

  async createDoctor(doctor: DoctorRecord): Promise<DoctorRecord> {
    const userId = doctor.userId?.trim();
    const clientId = doctor.clientId?.trim();
    if (!userId || !clientId) {
      throw new Error('userId and clientId are required');
    }
    if (this.doctors.some((d) => d.userId === userId)) {
      throw new Error('Doctor already exists');
    }
    if (!this.clients.some((c) => c.clientId === clientId)) {
      throw new Error(`Client ${clientId} not found`);
    }
    const created: DoctorRecord = {
      userId,
      clientId,
      role: 'doctor',
      assignments: (doctor.assignments ?? []).filter((a) =>
        Boolean(a.assignedVersion),
      ),
    };
    this.doctors.push(created);
    return created;
  }

  async putDoctorAssignments(
    userId: string,
    assignments: FeatureAssignment[],
  ): Promise<DoctorRecord> {
    const doctor = this.doctors.find((d) => d.userId === userId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    doctor.assignments = assignments;
    return doctor;
  }

  async getFeatureConfig(
    featureId: FeatureId,
    version: string,
  ): Promise<Record<string, unknown>> {
    const config = this.featureConfigs[featureId]?.[version];
    if (!config) {
      throw new Error(`Feature config not found for ${featureId} v${version}`);
    }
    return config;
  }
}
