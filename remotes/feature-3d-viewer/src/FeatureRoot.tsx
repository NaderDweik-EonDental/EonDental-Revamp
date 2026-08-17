import type { FeatureProps } from '@eon/core-sdk';
import { ViewerScreen } from './4-presentation/ViewerScreen.js';
import { createInMemoryViewerApi } from './3-infrastructure/viewerApiClient.js';
import { validateViewerConfig } from './3-infrastructure/validateViewerConfig.js';
import type { CameraPreset } from './1-domain/viewerRules.js';

export type ViewerFeatureConfig = {
  allowedFormats: string[];
  defaultCamera: CameraPreset;
};

const api = createInMemoryViewerApi();

function FeatureRoot({
  config,
  entitlement,
}: FeatureProps<ViewerFeatureConfig>) {
  if (!entitlement.enabled) {
    return (
      <div role="status" style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
        3D viewer is not enabled for this user.
      </div>
    );
  }

  const validated = validateViewerConfig(config);
  if (!validated.ok) {
    return (
      <div role="alert" style={{ padding: '1.5rem', color: '#9b1c1c' }}>
        <strong>Invalid 3d-viewer config</strong>
        <ul>
          {validated.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ViewerScreen
      config={validated.config}
      api={api}
      version={entitlement.version}
    />
  );
}

export default FeatureRoot;
