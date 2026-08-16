import { useEffect, useState } from 'react';
import type {
  ClientEntitlementRecord,
  ClientRecord,
  FeatureCatalogEntry,
} from '@eon/core-config-client';
import type { FeatureId } from '@eon/core-entitlements';
import { useAuth } from '../../../app-shell/AuthProvider.js';
import { formatFeatureVersion } from '../../../feature-versions.js';
import './superAdmin.css';

export function SuperAdminHome() {
  const { configClient } = useAuth();
  const [catalog, setCatalog] = useState<FeatureCatalogEntry[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState('');

  async function reload() {
    const [nextCatalog, nextClients] = await Promise.all([
      configClient.getFeatureCatalog(),
      configClient.listClients(),
    ]);
    setCatalog(nextCatalog);
    setClients(nextClients);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextCatalog, nextClients] = await Promise.all([
          configClient.getFeatureCatalog(),
          configClient.listClients(),
        ]);
        if (!cancelled) {
          setCatalog(nextCatalog);
          setClients(nextClients);
          setStatus('ready');
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
  }, [configClient]);

  if (status === 'loading') {
    return <p role="status">Loading super admin…</p>;
  }

  if (status === 'error') {
    return (
      <div role="alert">
        <strong>Super admin failed to load</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="super-admin">
      <header>
        <h1>Super admin</h1>
        <p className="super-admin__meta">
          Features ship two static versions. You do not create versions — you
          set, per client, which features are on and which of those versions
          the client may actually use. Client-admin can only assign the
          versions you check.
        </p>
      </header>

      {message ? <p className="super-admin__message">{message}</p> : null}

      <section className="super-admin__card">
        <h2>Feature catalog</h2>
        <p className="super-admin__meta">
          Read-only. Super-admin grants each client a subset of these versions
          with checkboxes.
        </p>
        {catalog.map((entry) => (
          <div key={entry.featureId} className="super-admin__catalog-row">
            <div>
              <strong>
                <code>{entry.featureId}</code>
              </strong>
              <ul className="super-admin__version-list">
                {entry.versions.map((version) => (
                  <li key={version}>
                    {formatFeatureVersion(entry.featureId, version)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="super-admin__card">
        <h2>Clients</h2>
        <div className="super-admin__inline">
          <input
            placeholder="new-client-id"
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              void (async () => {
                const clientId = newClientId.trim();
                if (!clientId) return;
                const entitlements: ClientEntitlementRecord[] = catalog.map(
                  (entry) => ({
                    featureId: entry.featureId,
                    enabled: false,
                    allowedVersions: [],
                  }),
                );
                await configClient.createClient({ clientId, entitlements });
                setNewClientId('');
                await reload();
                setMessage(`Created client ${clientId}`);
              })();
            }}
          >
            Create client
          </button>
        </div>

        {clients.map((client) => (
          <ClientCeilingEditor
            key={client.clientId}
            client={client}
            catalog={catalog}
            onSave={async (clientId, entitlements) => {
              await configClient.putClientEntitlements(clientId, entitlements);
              await reload();
              setMessage(`Updated available versions for ${clientId}`);
            }}
          />
        ))}
      </section>
    </section>
  );
}

function ClientCeilingEditor({
  client,
  catalog,
  onSave,
}: {
  client: ClientRecord;
  catalog: FeatureCatalogEntry[];
  onSave: (
    clientId: string,
    entitlements: ClientEntitlementRecord[],
  ) => Promise<void>;
}) {
  const [draft, setDraft] = useState(client.entitlements);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(client.entitlements);
  }, [client.entitlements]);

  function update(
    featureId: FeatureId,
    patch: Partial<ClientEntitlementRecord>,
  ) {
    setDraft((current) => {
      const existing = current.find((e) => e.featureId === featureId);
      if (existing) {
        return current.map((e) =>
          e.featureId === featureId ? { ...e, ...patch } : e,
        );
      }
      return [
        ...current,
        {
          featureId,
          enabled: false,
          allowedVersions: [],
          ...patch,
        },
      ];
    });
  }

  return (
    <article className="super-admin__client">
      <h3>
        <code>{client.clientId}</code>
      </h3>
      <div className="super-admin__entitlements">
        {catalog.map((entry) => {
          const entitlement = draft.find((e) => e.featureId === entry.featureId);
          return (
            <div key={entry.featureId} className="super-admin__entitlement-row">
              <label className="super-admin__check">
                <input
                  type="checkbox"
                  checked={entitlement?.enabled ?? false}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    update(entry.featureId, {
                      enabled,
                      allowedVersions: enabled
                        ? (entitlement?.allowedVersions.length
                            ? entitlement.allowedVersions
                            : [...entry.versions])
                        : [],
                    });
                  }}
                />
                {entry.featureId}
              </label>
              {entitlement?.enabled ? (
                <div className="super-admin__version-checks">
                  {entry.versions.map((version) => {
                    const checked =
                      entitlement.allowedVersions.includes(version);
                    return (
                      <label
                        key={version}
                        className="super-admin__check super-admin__check--version"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const current = entitlement.allowedVersions;
                            const allowedVersions = checked
                              ? current.filter((item) => item !== version)
                              : [...current, version];
                            update(entry.featureId, { allowedVersions });
                          }}
                        />
                        {formatFeatureVersion(entry.featureId, version)}
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
              await onSave(client.clientId, draft);
            } finally {
              setSaving(false);
            }
          })();
        }}
      >
        {saving ? 'Saving…' : 'Save available versions'}
      </button>
    </article>
  );
}
