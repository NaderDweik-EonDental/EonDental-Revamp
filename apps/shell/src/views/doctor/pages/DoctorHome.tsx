import { useEffect, useState } from 'react';
import type {
  EffectiveEntitlement,
  FeatureId,
} from '@eon/core-entitlements';
import type { ClientRecord } from '@eon/core-config-client';
import { useAuth } from '../../../app-shell/AuthProvider.js';
import { FeatureMount, isMountableFeature } from '../FeatureMount.js';
import { resolveDoctorFeatureEntitlement } from '../resolveDoctorFeatureEntitlement.js';
import './doctorHome.css';

interface FeatureSlot {
  featureId: FeatureId;
  entitlement: EffectiveEntitlement;
  config: Record<string, unknown>;
  reason: string;
}

interface DoctorHomeState {
  status: 'loading' | 'ready' | 'error';
  features: FeatureSlot[];
  doctorLabel: string;
  error: string | null;
}

/**
 * Doctor workspace: resolve effective access from catalog + cascade, then mount
 * enabled remotes independently via FeatureMount.
 */
export function DoctorHome() {
  const { session, configClient } = useAuth();
  const [state, setState] = useState<DoctorHomeState>({
    status: 'loading',
    features: [],
    doctorLabel: session.userId,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [doctor, catalog] = await Promise.all([
          configClient.getDoctor(session.userId),
          configClient.getFeatureCatalog(),
        ]);
        if (!doctor) {
          throw new Error(`Doctor not found: ${session.userId}`);
        }

        const client = await configClient.getClient(doctor.clientId);
        if (!client) {
          throw new Error(
            `Client ${doctor.clientId} not found for doctor ${doctor.userId}`,
          );
        }

        const features: FeatureSlot[] = [];
        for (const entry of catalog) {
          const featureId = entry.featureId;
          if (!isMountableFeature(featureId)) {
            continue;
          }

          const entitlement = resolveDoctorFeatureEntitlement(
            featureId,
            doctor,
            client,
          );
          const config =
            entitlement.enabled && entitlement.version
              ? await configClient.getFeatureConfig(
                  featureId,
                  entitlement.version,
                )
              : {};
          features.push({
            featureId,
            entitlement,
            config,
            reason: describeCascade(featureId, client, entitlement),
          });
        }

        if (!cancelled) {
          setState({
            status: 'ready',
            features,
            doctorLabel: `${doctor.userId} @ ${doctor.clientId}`,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            features: [],
            doctorLabel: session.userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [configClient, session.userId]);

  if (state.status === 'loading') {
    return <p role="status">Loading doctor workspace…</p>;
  }

  if (state.status === 'error') {
    return (
      <div role="alert">
        <strong>Could not load doctor workspace</strong>
        <p>{state.error ?? 'Unknown error'}</p>
      </div>
    );
  }

  const enabled = state.features.filter((f) => f.entitlement.enabled);

  return (
    <div className="doctor-home">
      <header className="doctor-home__header">
        <h1>Doctor workspace</h1>
        <p className="doctor-home__meta">
          Signed in as <code>{state.doctorLabel}</code>. Features come from the
          entitlement cascade (catalog → client ceiling → doctor assignment).
        </p>
      </header>

      {enabled.length > 0 ? (
        <aside className="doctor-home__cascade" aria-label="Entitlement cascade">
          <h2>Entitlement status</h2>
          <ul>
            {enabled.map((feature) => (
              <li key={feature.featureId}>
                <code>{feature.featureId}</code>
                <span className="doctor-home__pill doctor-home__pill--on">
                  on · v{feature.entitlement.version}
                </span>
                <small>{feature.reason}</small>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {enabled.length === 0 ? (
        <p role="status">No features are enabled for this doctor.</p>
      ) : (
        <div className="doctor-home__features">
          {enabled.map((feature) => (
            <FeatureMount
              key={`${feature.featureId}:${feature.entitlement.version ?? 'off'}`}
              featureId={feature.featureId}
              config={feature.config}
              entitlement={feature.entitlement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function describeCascade(
  featureId: FeatureId,
  client: ClientRecord,
  entitlement: EffectiveEntitlement,
): string {
  const tenant = client.entitlements.find((e) => e.featureId === featureId);
  if (!tenant || !tenant.enabled) {
    return 'Client ceiling disabled by super-admin';
  }

  if (!entitlement.enabled) {
    return 'Disabled by entitlement cascade';
  }

  return `Allowed versions: ${tenant.allowedVersions.join(', ')} · effective v${entitlement.version}`;
}
