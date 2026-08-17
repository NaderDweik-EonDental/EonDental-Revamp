import { type CaseApi, type SubmitCaseResult } from '../2-application/submitCase.js';
import { type AttachmentType, type CaseConfig, type CaseDraft, type ImpressionMethod, type PrescriptionAnswers } from '../1-domain/caseRules.js';
export interface UseCaseSubmissionArgs {
    config: CaseConfig;
    api: CaseApi;
}
export interface UseCaseSubmission {
    draft: CaseDraft;
    setPatientId: (patientId: string) => void;
    setNotes: (notes: string) => void;
    addAttachment: (type: AttachmentType, fileName: string) => void;
    removeAttachment: (index: number) => void;
    selectPackage: (packageId: string) => void;
    setImpressionMethod: (method: ImpressionMethod) => void;
    setImpressionVisit: (visitId: string) => void;
    setPrescription: <K extends keyof PrescriptionAnswers>(field: K, value: PrescriptionAnswers[K]) => void;
    submit: () => Promise<void>;
    submitting: boolean;
    lastResult: SubmitCaseResult | null;
    clearResult: () => void;
}
export declare function useCaseSubmission({ config, api, }: UseCaseSubmissionArgs): UseCaseSubmission;
