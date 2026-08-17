import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import { planConfigSchema } from './schema.js';

export type ParsedPlanConfig = {
  maxStages: number;
  allowVisitEstimate: boolean;
};

export type ConfigValidationResult =
  | { ok: true; config: ParsedPlanConfig }
  | { ok: false; errors: string[] };

const ajv = new Ajv({ allErrors: true, strict: true });
const validate: ValidateFunction = ajv.compile(planConfigSchema);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ['config failed validation'];
  }
  return errors.map((error) => {
    const path = error.instancePath || '(root)';
    return `${path} ${error.message ?? 'is invalid'}`.trim();
  });
}

export function validatePlanConfig(input: unknown): ConfigValidationResult {
  const valid = validate(input);
  if (!valid) {
    return { ok: false, errors: formatErrors(validate.errors) };
  }
  return { ok: true, config: input as ParsedPlanConfig };
}
