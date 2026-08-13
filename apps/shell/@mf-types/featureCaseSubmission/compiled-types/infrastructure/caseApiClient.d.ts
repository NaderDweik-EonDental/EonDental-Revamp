import type { CaseApi } from '../application/submitCase.js';
export interface CaseApiClientOptions {
    /** Swap this for a real API base URL later — nothing else changes. */
    baseUrl: string;
    fetchImpl?: typeof fetch;
}
export declare function createCaseApiClient(options: CaseApiClientOptions): CaseApi;
/** In-memory stand-in for local remote development until a real/mock API exists. */
export declare function createInMemoryCaseApi(): CaseApi;
//# sourceMappingURL=caseApiClient.d.ts.map