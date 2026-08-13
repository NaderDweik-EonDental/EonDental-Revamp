export type ModelFormat = 'stl' | 'ply' | 'obj';
export type CameraPreset = 'front' | 'occlusal' | 'lateral';
export type ArchRole = 'upper' | 'lower';

export interface ViewerLoadRequest {
  upperModelName: string;
  lowerModelName: string;
  format: ModelFormat;
  camera: CameraPreset;
}

export interface ViewerConfig {
  allowedFormats: string[];
  defaultCamera: CameraPreset;
}

export type ViewerValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function isAllowedFormat(
  format: string,
  config: ViewerConfig,
): format is ModelFormat {
  return config.allowedFormats.includes(format);
}

export function isValidViewerRequest(
  request: ViewerLoadRequest,
  config: ViewerConfig,
): ViewerValidationResult {
  const errors: string[] = [];

  if (!request.upperModelName.trim() && !request.lowerModelName.trim()) {
    errors.push('at least one of upper or lower model is required');
  }
  if (!isAllowedFormat(request.format, config)) {
    errors.push(
      `format ${request.format} is not allowed (allowed: ${config.allowedFormats.join(', ')})`,
    );
  }
  if (request.format !== 'stl') {
    errors.push('only STL meshes can be rendered in the 3D viewport');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
