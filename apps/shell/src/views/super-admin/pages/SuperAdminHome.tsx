import { useEffect, useState } from 'react';
import type {
  ClientEntitlementRecord,
  ClientRecord,
  FeatureCatalogEntry,
} from '@eon/core-config-client';
import type { FeatureId } from '@eon/core-entitlements';
import { useAuth } from '../../../app-shell/AuthProvider.js';
import './superAdmin.css';

export function SuperAdminHome() {
  const { configClient } = useAuth();
  const [catalog, setCatalog] = useState<FeatureCatalogEntry[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState('');
  const [newVersion, setNewVersion] = useState<Record<string, string>>({});

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
          Global catalog and per-client entitlement ceilings. Enabling a feature
          for a client turns it on for that client&apos;s doctors (they inherit
          the ceiling max unless client-admin assigns a lower version).
        </p>
      </header>

      {message ? <p className="super-admin__message">{message}</p> : null}

      <section className="super-admin__card">
        <h2>Feature catalog</h2>
        {catalog.map((entry) => (
          <div key={entry.featureId} className="super-admin__catalog-row">
            <div>
              <strong>
                <code>{entry.featureId}</code>
              </strong>
              <p>{entry.versions.join(', ')}</p>
            </div>
            <div className="super-admin__inline">
              <input
                placeholder="new version"
                value={newVersion[entry.featureId] ?? ''}
                onChange={(e) =>
                  setNewVersion((current) => ({
                    ...current,
                    [entry.featureId]: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const version = (newVersion[entry.featureId] ?? '').trim();
                    if (!version) return;
                    const next = catalog.map((item) =>
                      item.featureId === entry.featureId
                        ? {
                            ...item,
                            versions: item.versions.includes(version)
                              ? item.versions
                              : [...item.versions, version],
                          }
                        : item,
                    );
                    await configClient.putFeatureCatalog(next);
                    await reload();
                    setNewVersion((current) => ({
                      ...current,
                      [entry.featureId]: '',
                    }));
                    setMessage(`Added ${version} to ${entry.featureId}`);
                  })();
                }}
              >
                Add version
              </button>
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
                    allowedVersionRange: {
                      max: entry.versions[entry.versions.length - 1] ?? '0.0.0',
                    },
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
              setMessage(`Updated ceilings for ${clientId}`);
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
          allowedVersionRange: { max: '0.0.0' },
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
                  onChange={(e) =>
                    update(entry.featureId, { enabled: e.target.checked })
                  }
                />
                {entry.featureId}
              </label>
              <select
                value={entitlement?.allowedVersionRange.max ?? ''}
                onChange={(e) =>
                  update(entry.featureId, {
                    allowedVersionRange: { max: e.target.value },
                  })
                }
              >
                {entry.versions.map((version) => (
                  <option key={version} value={version}>
                    max {version}
                  </option>
                ))}
              </select>
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
        {saving ? 'Saving…' : 'Save ceilings'}
      </button>
    </article>
  );
}
