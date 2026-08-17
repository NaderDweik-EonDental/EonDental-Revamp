export type AttachmentType = 'photo' | 'xray' | 'scan';

export interface CaseAttachment {
  type: AttachmentType;
  fileName: string;
}

export type PackageAccent =
  | 'slate'
  | 'graphite'
  | 'navy'
  | 'coral'
  | 'emerald'
  | 'teal'
  | 'mint'
  | 'plum';

export interface CasePackage {
  id: string;
  code: string;
  label: string;
  accent: PackageAccent;
  description: string;
  maxAlignerSteps: number | 'unlimited';
  durationMonths: number | 'unlimited';
  refinements: number | 'unlimited';
  tsRevisions: number | 'unlimited';
  retainerSets: number | 'unlimited';
}

export type ImpressionMethod =
  | 'upload_3d_scans'
  | '3shape_communicate'
  | 'other'
  | 'impression_pickup';

export type PrescriptionChoice = 'not_applicable' | 'yes' | null;
export type PrescriptionCorrectionChoice =
  | 'not_applicable'
  | 'improve'
  | 'correct'
  | null;
export type ArchSelection = 'upper_lower' | 'upper' | 'lower' | null;

export interface PrescriptionAnswers {
  chiefComplaint: string;
  additionalNotes: string;
  arch: ArchSelection;
  hasPrimaryTeeth: boolean | null;
  teethMovementRestrictions: PrescriptionChoice;
  attachmentRestrictions: PrescriptionChoice;
  crossbite: PrescriptionChoice;
  extraction: PrescriptionChoice;
  classIIIII: PrescriptionCorrectionChoice;
  midline: PrescriptionCorrectionChoice;
}

export const emptyPrescription: PrescriptionAnswers = {
  chiefComplaint: '',
  additionalNotes: '',
  arch: null,
  hasPrimaryTeeth: null,
  teethMovementRestrictions: null,
  attachmentRestrictions: null,
  crossbite: null,
  extraction: null,
  classIIIII: null,
  midline: null,
};

export interface CaseDraft {
  patientId: string;
  notes?: string;
  attachments: CaseAttachment[];
  selectedPackageId: string | null;
  impressionMethod: ImpressionMethod | null;
  impressionVisitId: string | null;
  prescription: PrescriptionAnswers;
}

export interface CaseConfig {
  requireXray: boolean;
  maxAttachments: number;
  /** Absent/empty on versions that skip the "Packages" step entirely. */
  packages?: CasePackage[];
}

export type CaseValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function requiredAttachmentsFor(config: CaseConfig): AttachmentType[] {
  const required: AttachmentType[] = ['photo'];
  if (config.requireXray) {
    required.push('xray');
  }
  return required;
}

export function hasPackagesStep(config: CaseConfig): boolean {
  return Boolean(config.packages && config.packages.length > 0);
}

export function isValidCase(
  draft: CaseDraft,
  config: CaseConfig,
): CaseValidationResult {
  const errors: string[] = [];

  if (!draft.patientId.trim()) {
    errors.push('patientId is required');
  }

  if (draft.attachments.length > config.maxAttachments) {
    errors.push(
      `at most ${config.maxAttachments} attachment(s) allowed (got ${draft.attachments.length})`,
    );
  }

  const presentTypes = new Set(draft.attachments.map((a) => a.type));
  for (const type of requiredAttachmentsFor(config)) {
    if (!presentTypes.has(type)) {
      errors.push(`missing required attachment type: ${type}`);
    }
  }

  for (const attachment of draft.attachments) {
    if (!attachment.fileName.trim()) {
      errors.push('every attachment must have a fileName');
      break;
    }
  }

  if (hasPackagesStep(config) && !draft.selectedPackageId) {
    errors.push('a package must be selected');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
