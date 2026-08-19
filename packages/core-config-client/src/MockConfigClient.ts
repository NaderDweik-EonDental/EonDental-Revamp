import type { FeatureId } from '@eon/core-entitlements';
import type {
  ClientEntitlementRecord,
  ClientRecord,
  ConfigClient,
  DoctorRecord,
  FeatureAssignment,
  FeatureCatalogEntry,
} from './ConfigClient.js';

export interface HttpConfigClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

async function readJsonOrNull<T>(response: Response): Promise<T | null> {
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Config API error: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Config API error: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/**
 * HTTP implementation of ConfigClient.
 * Against MSW mock handlers today; swap base URL / hosting later.
 */
export class MockConfigClient implements ConfigClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpConfigClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '/api').replace(/\/$/, '');
    // Don't store unbound `fetch` — browsers require Window as `this`.
    this.fetchImpl =
      options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  async getFeatureCatalog(): Promise<FeatureCatalogEntry[]> {
    const response = await this.fetchImpl(`${this.baseUrl}/feature-catalog`);
    const data = await readJsonOrNull<FeatureCatalogEntry[]>(response);
    return data ?? [];
  }

  async listClients(): Promise<ClientRecord[]> {
    const response = await this.fetchImpl(`${this.baseUrl}/clients`);
    return readJson<ClientRecord[]>(response);
  }

  async getClient(clientId: string): Promise<ClientRecord | null> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/clients/${encodeURIComponent(clientId)}`,
    );
    return readJsonOrNull<ClientRecord>(response);
  }

  async createClient(client: ClientRecord): Promise<ClientRecord> {
    const response = await this.fetchImpl(`${this.baseUrl}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    return readJson<ClientRecord>(response);
  }

  async putClientEntitlements(
    clientId: string,
    entitlements: ClientEntitlementRecord[],
  ): Promise<ClientRecord> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/clients/${encodeURIComponent(clientId)}/entitlements`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entitlements),
      },
    );
    return readJson<ClientRecord>(response);
  }

  async listDoctors(clientId?: string | null): Promise<DoctorRecord[]> {
    const url =
      clientId === undefined || clientId === null
        ? `${this.baseUrl}/doctors`
        : `${this.baseUrl}/doctors?clientId=${encodeURIComponent(clientId)}`;
    const response = await this.fetchImpl(url);
    return readJson<DoctorRecord[]>(response);
  }

  async getDoctor(userId: string): Promise<DoctorRecord | null> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/doctors/${encodeURIComponent(userId)}`,
    );
    return readJsonOrNull<DoctorRecord>(response);
  }

  async createDoctor(doctor: DoctorRecord): Promise<DoctorRecord> {
    const response = await this.fetchImpl(`${this.baseUrl}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    });
    return readJson<DoctorRecord>(response); 
  }

  async putDoctorAssignments(
    userId: string,        
    assignments: FeatureAssignment[],
  ): Promise<DoctorRecord> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/doctors/${encodeURIComponent(userId)}/assignments`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignments),
      },
    );
    return readJson<DoctorRecord>(response);
  }

  async getFeatureConfig(
    featureId: FeatureId,
    version: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/features/${encodeURIComponent(featureId)}/config?version=${encodeURIComponent(version)}`,
    );
    if (!response.ok) {
      throw new Error(
        `Feature config not found for ${featureId} v${version}: ${response.status}`,
      );
    }
    return (await response.json()) as Record<string, unknown>;
  }
}
