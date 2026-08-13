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
import {
  assignableVersionsWithinCeiling,
  entitlementForFeature,
} from '../assignableVersions.js';
import './clientAdmin.css';

export function ClientAdminHome() {
  const { configClient } = useAuth();
  const { managedClientId } = useViewSwitcher();
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
  }, [configClient, managedClientId]);

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
    await reload();
    setMessage(
      `Saved assignments for ${doctor.userId}. Switch to Doctor view to see the effect.`,
    );
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
          Managing <code>{client.clientId}</code>. Super-admin sets which
          features are enabled (ceiling). You assign versions within that
          ceiling. Unassigned doctors inherit the ceiling max version when the
          feature is enabled.
        </p>
      </header>

      {message ? <p className="client-admin__message">{message}</p> : null}

      <div className="client-admin__ceilings">
        <h2>Client ceiling (from super-admin)</h2>
        <ul>
          {catalog.map((entry) => {
            const entitlement = entitlementForFeature(
              client.entitlements,
              entry.featureId,
            );
            return (
              <li key={entry.featureId}>
                <code>{entry.featureId}</code> —{' '}
                {entitlement?.enabled
                  ? `enabled · max ${entitlement.allowedVersionRange.max}`
                  : 'disabled for this client (doctors cannot access)'}
              </li>
            );
          })}
        </ul>
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

  const featureIds = catalog.map((entry) => entry.featureId);

  function versionFor(featureId: FeatureId): string {
    return draft.find((a) => a.featureId === featureId)?.assignedVersion ?? '';
  }

  function setVersion(featureId: FeatureId, assignedVersion: string) {
    setDraft((current) => {
      const without = current.filter((a) => a.featureId !== featureId);
      if (!assignedVersion) {
        return without;
      }
      return [...without, { featureId, assignedVersion }];
    });
  }

  return (
    <article className="client-admin__doctor">
      <h2>
        <code>{doctor.userId}</code>
      </h2>
      <div className="client-admin__assignments">
        {featureIds.map((featureId) => {
          const entitlement = entitlementForFeature(
            client.entitlements,
            featureId,
          );
          const versions = assignableVersionsWithinCeiling(
            catalog.find((c) => c.featureId === featureId)?.versions ?? [],
            entitlement,
          );
          return (
            <label key={featureId}>
              {featureId}
              <select
                value={versionFor(featureId)}
                disabled={versions.length === 0}
                onChange={(e) => setVersion(featureId, e.target.value)}
              >
                <option value="">
                  {entitlement?.enabled
                    ? `— inherit ceiling (v${entitlement.allowedVersionRange.max}) —`
                    : '— disabled by client ceiling —'}
                </option>
                {versions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          void (async () => {
            setSaving(true);
            try {
              await onSave(doctor, draft);
            } finally {
              setSaving(false);
            }
          })();
        }}
      >
        {saving ? 'Saving…' : 'Save assignments'}
      </button>
    </article>
  );
}
