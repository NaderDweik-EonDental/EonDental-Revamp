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

const STORAGE_KEY = 'eon-config-api-v1';
const CHANNEL_NAME = 'eon-config-api';

/** In-memory mutable store — MSW handlers read/write this so admin edits persist. */
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
    'treatment-plan': {
      '1.0.0': { maxStages: 3, allowVisitEstimate: false },
      '1.1.0': { maxStages: 5, allowVisitEstimate: true },
    },
  } as FeatureConfigByVersion,
};

interface PersistedStore {
  clients: ClientRecord[];
  doctors: DoctorRecord[];
  featureCatalog: FeatureCatalogEntry[];
}

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function snapshot(): PersistedStore {
  return {
    clients: store.clients,
    doctors: store.doctors,
    featureCatalog: store.featureCatalog,
  };
}

function applySnapshot(data: PersistedStore): void {
  store.clients = clone(data.clients);
  store.doctors = clone(data.doctors);
  store.featureCatalog = clone(data.featureCatalog);
}

/** Demo localStorage can be older than seed. Fill in newly added features. */
function mergeMissingFromSeed(): void {
  const catalogHave = new Set(store.featureCatalog.map((e) => e.featureId));
  for (const entry of clone(featureCatalogSeed) as FeatureCatalogEntry[]) {
    if (!catalogHave.has(entry.featureId)) {
      store.featureCatalog.push(entry);
    }
  }

  const seedClients = clone(clientsSeed) as ClientRecord[];
  store.clients = store.clients.map((client) => {
    const seed = seedClients.find((c) => c.clientId === client.clientId);
    if (!seed) {
      return client;
    }
    const have = new Set(client.entitlements.map((e) => e.featureId));
    const missing = seed.entitlements.filter((e) => !have.has(e.featureId));
    if (missing.length === 0) {
      return client;
    }
    return { ...client, entitlements: [...client.entitlements, ...missing] };
  });

  const seedDoctors = clone(doctorsSeed) as DoctorRecord[];
  store.doctors = store.doctors.map((doctor) => {
    const seed = seedDoctors.find((d) => d.userId === doctor.userId);
    if (!seed) {
      return doctor;
    }
    const have = new Set(doctor.assignments.map((a) => a.featureId));
    const missing = seed.assignments.filter((a) => !have.has(a.featureId));
    if (missing.length === 0) {
      return doctor;
    }
    return { ...doctor, assignments: [...doctor.assignments, ...missing] };
  });
}

function readPersisted(): PersistedStore | null {
  if (!canUseBrowserStorage()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as PersistedStore;
    if (!Array.isArray(data.clients) || !Array.isArray(data.doctors)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function hydrateFromStorage(): void {
  const data = readPersisted();
  if (data) {
    applySnapshot(data);
  }
  mergeMissingFromSeed();
}

hydrateFromStorage();

/** Write current entitlements/assignments and notify other tabs. */
export function persistStore(): void {
  if (!canUseBrowserStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'updated' });
    channel.close();
  }
}

/** Hydrate from localStorage then run `onChange` when another tab writes. */
export function subscribeStore(onChange: () => void): () => void {
  if (!canUseBrowserStorage()) {
    return () => undefined;
  }

  hydrateFromStorage();

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    hydrateFromStorage();
    onChange();
  };
  window.addEventListener('storage', onStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => {
      hydrateFromStorage();
      onChange();
    };
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}
