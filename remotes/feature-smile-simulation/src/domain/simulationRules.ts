export type ToothShade = 'A1' | 'A2' | 'A3' | 'B1' | 'B2';

export interface SmileSimulationDraft {
  patientId: string;
  sourcePhotoName: string;
  targetShade: ToothShade;
  includeWhiteningPreview: boolean;
}

export interface SmileSimulationConfig {
  maxShadeOptions: number;
  allowWhiteningPreview: boolean;
}

export type SmileValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

const SHADE_ORDER: ToothShade[] = ['A1', 'A2', 'A3', 'B1', 'B2'];

export function availableShadesFor(
  config: SmileSimulationConfig,
): ToothShade[] {
  return SHADE_ORDER.slice(0, Math.max(0, config.maxShadeOptions));
}

export function hasShadeAndWhiteningControls(
  config: SmileSimulationConfig,
): boolean {
  return config.allowWhiteningPreview && config.maxShadeOptions > 0;
}

export function isValidSimulation(
  draft: SmileSimulationDraft,
  config: SmileSimulationConfig,
): SmileValidationResult {
  const errors: string[] = [];

  if (!draft.patientId.trim()) {
    errors.push('patientId is required');
  }
  if (!draft.sourcePhotoName.trim()) {
    errors.push('sourcePhotoName is required');
  }

  const allowed = availableShadesFor(config);
  if (
    hasShadeAndWhiteningControls(config) &&
    !allowed.includes(draft.targetShade)
  ) {
    errors.push(`targetShade ${draft.targetShade} is not in the allowed set`);
  }

  if (draft.includeWhiteningPreview && !config.allowWhiteningPreview) {
    errors.push('whitening preview is disabled by config');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
