import { useState } from 'react';
import {
  submitCase,
  type CaseApi,
  type SubmitCaseResult,
} from '../2-application/submitCase.js';
import {
  emptyPrescription,
  type AttachmentType,
  type CaseConfig,
  type CaseDraft,
  type ImpressionMethod,
  type PrescriptionAnswers,
} from '../1-domain/caseRules.js';

export interface UseCaseSubmissionArgs {
  config: CaseConfig;
  api: CaseApi;
}

function emptyDraft(): CaseDraft {
  return {
    patientId: '',
    notes: '',
    attachments: [],
    selectedPackageId: null,
    impressionMethod: null,
    impressionVisitId: null,
    prescription: { ...emptyPrescription },
  };
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
  setPrescription: <K extends keyof PrescriptionAnswers>(
    field: K,
    value: PrescriptionAnswers[K],
  ) => void;
  submit: () => Promise<void>;
  submitting: boolean;
  lastResult: SubmitCaseResult | null;
  clearResult: () => void;
}

export function useCaseSubmission({
  config,
  api,
}: UseCaseSubmissionArgs): UseCaseSubmission {
  const [draft, setDraft] = useState<CaseDraft>(emptyDraft());
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitCaseResult | null>(null);

  return {
    draft,
    setPatientId: (patientId) => {
      setDraft((current) => ({ ...current, patientId }));
    },
    setNotes: (notes) => {
      setDraft((current) => ({ ...current, notes }));
    },
    addAttachment: (type, fileName) => {
      setDraft((current) => ({
        ...current,
        attachments: [...current.attachments, { type, fileName }],
      }));
    },
    removeAttachment: (index) => {
      setDraft((current) => ({
        ...current,
        attachments: current.attachments.filter((_, i) => i !== index),
      }));
    },
    selectPackage: (packageId) => {
      setDraft((current) => ({ ...current, selectedPackageId: packageId }));
    },
    setImpressionMethod: (method) => {
      setDraft((current) => ({
        ...current,
        impressionMethod: method,
        impressionVisitId:
          method === '3shape_communicate' ? current.impressionVisitId : null,
      }));
    },
    setImpressionVisit: (visitId) => {
      setDraft((current) => ({ ...current, impressionVisitId: visitId }));
    },
    setPrescription: (field, value) => {
      setDraft((current) => ({
        ...current,
        prescription: { ...current.prescription, [field]: value },
      }));
    },
    submit: async () => {
      setSubmitting(true);
      try {
        const result = await submitCase(draft, config, api);
        setLastResult(result);
        if (result.ok) {
          setDraft(emptyDraft());
        }
      } finally {
        setSubmitting(false);
      }
    },
    submitting,
    lastResult,
    clearResult: () => setLastResult(null),
  };
}
