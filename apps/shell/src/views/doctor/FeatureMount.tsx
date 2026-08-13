import { lazy, Suspense, useMemo, type ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type {
  EffectiveEntitlement,
  FeatureId,
} from '@eon/core-entitlements';
import type { FeatureProps } from '@eon/core-sdk';
import './featureMount.css';

export interface FeatureMountProps {
  featureId: FeatureId;
  config: Record<string, unknown>;
  entitlement: EffectiveEntitlement;
}

type RemoteModule = { default: ComponentType<FeatureProps> };

const remoteLoaders: Record<FeatureId, () => Promise<RemoteModule>> = {
  'case-submission': () => import('featureCaseSubmission/FeatureRoot'),
  'smile-simulation': () => import('featureSmileSimulation/FeatureRoot'),
  '3d-viewer': () => import('feature3dViewer/FeatureRoot'),
};

function FeatureLoadingSkeleton({ featureId }: { featureId: FeatureId }) {
  return (
    <p role="status" className="feature-mount__status">
      Loading {featureId}…
    </p>
  );
}

function FeatureLoadError({
  featureId,
  error,
}: {
  featureId: FeatureId;
  error: unknown;
}) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="feature-mount__error">
      <strong>Failed to load {featureId}</strong>
      <p>{message}</p>
    </div>
  );
}

export function FeatureMount({
  featureId,
  config,
  entitlement,
}: FeatureMountProps) {
  const Component = useMemo(
    () => lazy(remoteLoaders[featureId]),
    [featureId],
  );

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <FeatureLoadError featureId={featureId} error={error} />
      )}
    >
      <Suspense fallback={<FeatureLoadingSkeleton featureId={featureId} />}>
        <Component config={config} entitlement={entitlement} />
      </Suspense>
    </ErrorBoundary>
  );
}
