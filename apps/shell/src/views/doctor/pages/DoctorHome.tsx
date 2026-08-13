import { useEffect, useState } from 'react';
import type {
  EffectiveEntitlement,
  FeatureId,
} from '@eon/core-entitlements';
import { useAuth } from '../../../app-shell/AuthProvider.js';
import { FeatureMount } from '../FeatureMount.js';
import { resolveDoctorFeatureEntitlement } from '../resolveDoctorFeatureEntitlement.js';
import './doctorHome.css';

const FEATURE_IDS: FeatureId[] = [
  'case-submission',
  'smile-simulation',
  '3d-viewer',
];

interface FeatureSlot {
  featureId: FeatureId;
  entitlement: EffectiveEntitlement;
  config: Record<string, unknown>;
}

interface DoctorHomeState {
  status: 'loading' | 'ready' | 'error';
  features: FeatureSlot[];
  error: string | null;
}

/**
 * Doctor workspace: resolve effective access for each known feature, then mount
 * enabled remotes independently via FeatureMount.
 */
export function DoctorHome() {
  const { session, configClient } = useAuth();
  const [state, setState] = useState<DoctorHomeState>({
    status: 'loading',
    features: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const doctor = await configClient.getDoctor(session.userId);
        if (!doctor) {
          throw new Error(`Doctor not found: ${session.userId}`);
        }

        const client =
          doctor.clientId === null
            ? null
            : await configClient.getClient(doctor.clientId);

        const features: FeatureSlot[] = [];
        for (const featureId of FEATURE_IDS) {
          const entitlement = resolveDoctorFeatureEntitlement(
            featureId,
            doctor,
            client,
          );
          const config = entitlement.enabled
            ? await configClient.getFeatureConfig(featureId)
            : {};
          features.push({ featureId, entitlement, config });
        }

        if (!cancelled) {
          setState({ status: 'ready', features, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            features: [],
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
  const disabled = state.features.filter((f) => !f.entitlement.enabled);

  return (
    <div className="doctor-home">
      {enabled.length === 0 ? (
        <p role="status">No features are enabled for this doctor.</p>
      ) : (
        <div className="doctor-home__features">
          {enabled.map((feature) => (
            <FeatureMount
              key={feature.featureId}
              featureId={feature.featureId}
              config={feature.config}
              entitlement={feature.entitlement}
            />
          ))}
        </div>
      )}

      {disabled.length > 0 ? (
        <aside className="doctor-home__disabled-list">
          <h2>Unavailable</h2>
          <ul>
            {disabled.map((feature) => (
              <li key={feature.featureId}>
                <code>{feature.featureId}</code> — disabled by entitlement
                cascade
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
