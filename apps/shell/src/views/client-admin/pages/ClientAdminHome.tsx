import { useEffect, useState } from 'react';
import type {
  DoctorRecord,
  FeatureAssignment,
  FeatureCatalogEntry,
  ClientRecord,
} from '@eon/core-config-client';
import type { FeatureId } from '@eon/core-entitlements';
import { useAuth } from '../../../app-shell/AuthProvider.js';
import { useViewSwitcher } from '../../../view-switcher/ViewSwitcherContext.js';
import { formatFeatureVersion } from '../../../feature-versions.js';
import {
  assignableVersionsWithinCeiling,
  entitlementForFeature,
  isFeatureOffered,
  defaultAssignedVersion,
} from '../assignableVersions.js';
import './clientAdmin.css';

export function ClientAdminHome() {
  const { configClient } = useAuth();
  const { managedClientId, configRevision, bumpConfigRevision } =
    useViewSwitcher();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [catalog, setCatalog] = useState<FeatureCatalogEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextClient, nextDoctors, nextCatalog] = await Promise.all([
          configClient.getClient(managedClientId),
          configClient.listDoctors(managedClientId),
          configClient.getFeatureCatalog(),
        ]);
        if (!nextClient) {
          throw new Error(`Client not found: ${managedClientId}`);
        }
        if (!cancelled) {
          setClient(nextClient);
          setDoctors(nextDoctors);
          setCatalog(nextCatalog);
          setStatus('ready');
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configClient, configRevision, managedClientId]);

  async function reload() {
    const [nextClient, nextDoctors, nextCatalog] = await Promise.all([
      configClient.getClient(managedClientId),
      configClient.listDoctors(managedClientId),
      configClient.getFeatureCatalog(),
    ]);
    if (!nextClient) {
      throw new Error(`Client not found: ${managedClientId}`);
    }
    setClient(nextClient);
    setDoctors(nextDoctors);
    setCatalog(nextCatalog);
  }
  async function saveAssignments(
    doctor: DoctorRecord,
    assignments: FeatureAssignment[],
  ) {
    setMessage(null);
    await configClient.putDoctorAssignments(doctor.userId, assignments);
    bumpConfigRevision();
    await reload();
    setMessage(`Updated versions for ${doctor.userId}.`);
  }

  if (status === 'loading') {
    return <p role="status">Loading client admin…</p>;
  }

  if (status === 'error' || !client) {
    return (
      <div role="alert">
        <strong>Client admin failed to load</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="client-admin">
      <header>
        <h1>Client admin</h1>
        <p className="client-admin__meta">
          Managing <code>{client.clientId}</code>. Super-admin turns features
          on and checks which versions this client may use. Version changes
          save immediately. Unassigned doctors inherit the highest allowed
          version.
        </p>
      </header>

      {message ? <p className="client-admin__message">{message}</p> : null}

      <div className="client-admin__ceilings">
        <h2>Client ceiling (from super-admin)</h2>
        {catalog.filter((entry) =>
          isFeatureOffered(
            entitlementForFeature(client.entitlements, entry.featureId),
          ),
        ).length === 0 ? (
          <p className="client-admin__meta">
            No features are enabled for this client.
          </p>
        ) : (
          <ul>
            {catalog.map((entry) => {
              const entitlement = entitlementForFeature(
                client.entitlements,
                entry.featureId,
              );
              if (!isFeatureOffered(entitlement)) {
                return null;
              }
              return (
                <li key={entry.featureId}>
                  <code>{entry.featureId}</code> —{' '}
                  {entitlement.allowedVersions
                    .map((version) =>
                      formatFeatureVersion(entry.featureId, version),
                    )
                    .join(' · ')}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {doctors.map((doctor) => (
        <DoctorAssignmentCard
          key={doctor.userId}
          doctor={doctor}
          client={client}
          catalog={catalog}
          onSave={saveAssignments}
        />
      ))}
    </section>
  );
}

function DoctorAssignmentCard({
  doctor,
  client,
  catalog,
  onSave,
}: {
  doctor: DoctorRecord;
  client: ClientRecord;
  catalog: FeatureCatalogEntry[];
  onSave: (
    doctor: DoctorRecord,
    assignments: FeatureAssignment[],
  ) => Promise<void>;
}) {
  const [draft, setDraft] = useState<FeatureAssignment[]>(doctor.assignments);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(doctor.assignments);
  }, [doctor.assignments]);

  const featureIds = catalog
    .map((entry) => entry.featureId)
    .filter(
      (featureId) =>
        isFeatureOffered(
          entitlementForFeature(client.entitlements, featureId),
        ),
    );

  function versionFor(featureId: FeatureId): string {
    return draft.find((a) => a.featureId === featureId)?.assignedVersion ?? '';
  }

  function setVersion(featureId: FeatureId, assignedVersion: string) {
    setDraft((current) => {
      const without = current.filter((a) => a.featureId !== featureId);
      const next = !assignedVersion
        ? without
        : [...without, { featureId, assignedVersion }];
      void persist(next);
      return next;
    });
  }

  async function persist(assignments: FeatureAssignment[]) {
    setSaving(true);
    try {
      await onSave(doctor, assignments);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="client-admin__doctor">
      <h2>
        <code>{doctor.userId}</code>
      </h2>
      <div className="client-admin__assignments">
        {featureIds.length === 0 ? (
          <p className="client-admin__meta">
            No features to assign — super-admin has not enabled any for this
            client.
          </p>
        ) : (
          featureIds.map((featureId) => {
            const entitlement = entitlementForFeature(
              client.entitlements,
              featureId,
            );
            const versions = assignableVersionsWithinCeiling(
              catalog.find((c) => c.featureId === featureId)?.versions ?? [],
              entitlement,
            );
            const inheritVersion = defaultAssignedVersion(entitlement);
            return (
              <label key={featureId}>
                {featureId}
                <select
                  value={versionFor(featureId)}
                  onChange={(e) => setVersion(featureId, e.target.value)}
                >
                  <option value="">
                    {inheritVersion
                      ? `— inherit (${formatFeatureVersion(featureId, inheritVersion)}) —`
                      : '— inherit —'}
                  </option>
                  {versions.map((version) => (
                    <option key={version} value={version}>
                      {formatFeatureVersion(featureId, version)}
                    </option>
                  ))}
                </select>
              </label>
            );
          })
        )}
      </div>
      {saving ? (
        <p className="client-admin__meta">Saving…</p>
      ) : (
        <p className="client-admin__meta">Saved for this doctor immediately.</p>
      )}
    </article>
  );
}
