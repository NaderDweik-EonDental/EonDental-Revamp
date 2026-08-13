import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import type { SmileSimulationConfig } from '../domain/simulationRules.js';
import { smileConfigSchema } from './smileConfigSchema.js';

export type ConfigValidationResult =
  | { ok: true; config: SmileSimulationConfig }
  | { ok: false; errors: string[] };

const ajv = new Ajv({ allErrors: true, strict: true });
const validate: ValidateFunction = ajv.compile(smileConfigSchema);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ['config failed validation'];
  }
  return errors.map((error) => {
    const path = error.instancePath || '(root)';
    return `${path} ${error.message ?? 'is invalid'}`.trim();
  });
}

export function validateSmileConfig(input: unknown): ConfigValidationResult {
  const valid = validate(input);
  if (!valid) {
    return { ok: false, errors: formatErrors(validate.errors) };
  }
  return { ok: true, config: input as SmileSimulationConfig };
}
