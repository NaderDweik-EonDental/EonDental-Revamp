import { type CaseConfig, type CaseDraft } from '../1-domain/caseRules.js';
export interface SubmittedCase {
    caseId: string;
    patientId: string;
    submittedAt: string;
}
export interface CaseApi {
    submit(draft: CaseDraft): Promise<SubmittedCase>;
}
export type SubmitCaseResult = {
    ok: true;
    case: SubmittedCase;
} | {
    ok: false;
    errors: string[];
};
export declare function submitCase(draft: CaseDraft, config: CaseConfig, api: CaseApi): Promise<SubmitCaseResult>;
//# sourceMappingURL=submitCase.d.ts.map