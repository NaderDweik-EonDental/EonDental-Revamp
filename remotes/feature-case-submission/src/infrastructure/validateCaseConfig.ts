import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import type { CaseConfig } from '../domain/caseRules.js';
import { caseConfigSchema } from './caseConfigSchema.js';

export type ConfigValidationResult =
  | { ok: true; config: CaseConfig }
  | { ok: false; errors: string[] };

const ajv = new Ajv({ allErrors: true, strict: true });
const validate: ValidateFunction = ajv.compile(caseConfigSchema);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ['config failed validation'];
  }
  return errors.map((error) => {
    const path = error.instancePath || '(root)';
    return `${path} ${error.message ?? 'is invalid'}`.trim();
  });
}

/**
 * Validate feature config at the federation boundary before it reaches presentation.
 * Fail loud on bad/stale client config.
 */
export function validateCaseConfig(input: unknown): ConfigValidationResult {
  const valid = validate(input);
  if (!valid) {
    return { ok: false, errors: formatErrors(validate.errors) };
  }

  return { ok: true, config: input as CaseConfig };
}
