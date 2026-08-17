import type { CaseApi } from '../2-application/submitCase.js';
import { type CaseConfig } from '../1-domain/caseRules.js';
import './caseSubmission.css';
export interface CaseSubmissionScreenProps {
    config: CaseConfig;
    api: CaseApi;
    version: string | null;
}
export declare function CaseSubmissionScreen({ config, api, version, }: CaseSubmissionScreenProps): import("react").JSX.Element;
//# sourceMappingURL=CaseSubmissionScreen.d.ts.map