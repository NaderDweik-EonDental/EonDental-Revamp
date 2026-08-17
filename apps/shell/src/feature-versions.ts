import type { FeatureId } from '@eon/core-entitlements';

/** Static product versions. Super-admin does not create new ones. */
export const STATIC_FEATURE_VERSIONS: Record<
  FeatureId,
  { version: string; label: string }[]
> = {
  'case-submission': [
    { version: '1.0.0', label: 'No packages' },
    { version: '2.1.0', label: 'With packages' },
  ],
  'smile-simulation': [
    { version: '1.0.0', label: 'No shade or whitening' },
    { version: '1.4.0', label: 'Target shade + whitening preview' },
  ],
  '3d-viewer': [
    { version: '1.0.0', label: 'STL only' },
    { version: '1.3.1', label: 'STL and PLY' },
  ],
  'treatment-plan': [
    { version: '1.0.0', label: 'Stages only' },
    { version: '1.1.0', label: 'Stages + visit estimate' },
  ],
};

export function formatFeatureVersion(
  featureId: FeatureId,
  version: string,
): string {
  const label = STATIC_FEATURE_VERSIONS[featureId]?.find(
    (entry) => entry.version === version,
  )?.label;
  return label ? `${version} — ${label}` : version;
}
