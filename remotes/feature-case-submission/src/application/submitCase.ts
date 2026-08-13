import { isValidCase, type CaseConfig, type CaseDraft } from '../domain/caseRules.js';

export interface SubmittedCase {
  caseId: string;
  patientId: string;
  submittedAt: string;
}

export interface CaseApi {
  submit(draft: CaseDraft): Promise<SubmittedCase>;
}

export type SubmitCaseResult =
  | { ok: true; case: SubmittedCase }
  | { ok: false; errors: string[] };

export async function submitCase(
  draft: CaseDraft,
  config: CaseConfig,
  api: CaseApi,
): Promise<SubmitCaseResult> {
  const validation = isValidCase(draft, config);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const submitted = await api.submit(draft);
  return { ok: true, case: submitted };
}
