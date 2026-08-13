import type { CaseApi, SubmittedCase } from '../application/submitCase.js';
import type { CaseDraft } from '../domain/caseRules.js';

export interface CaseApiClientOptions {
  /** Swap this for a real API base URL later — nothing else changes. */
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export function createCaseApiClient(options: CaseApiClientOptions): CaseApi {
  const fetchImpl =
    options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  const baseUrl = options.baseUrl.replace(/\/$/, '');

  return {
    async submit(draft: CaseDraft): Promise<SubmittedCase> {
      const response = await fetchImpl(`${baseUrl}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error(
          `case API submit failed: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as SubmittedCase;
    },
  };
}

/** In-memory stand-in for local remote development until a real/mock API exists. */
export function createInMemoryCaseApi(): CaseApi {
  let sequence = 0;
  return {
    async submit(draft: CaseDraft): Promise<SubmittedCase> {
      sequence += 1;
      return {
        caseId: `case_${sequence}`,
        patientId: draft.patientId,
        submittedAt: new Date().toISOString(),
      };
    },
  };
}
