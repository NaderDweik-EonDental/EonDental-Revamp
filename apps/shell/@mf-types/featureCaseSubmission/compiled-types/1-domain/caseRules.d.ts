export type AttachmentType = 'photo' | 'xray' | 'scan';
export interface CaseAttachment {
    type: AttachmentType;
    fileName: string;
}
export type PackageAccent = 'slate' | 'graphite' | 'navy' | 'coral' | 'emerald' | 'teal' | 'mint' | 'plum';
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
export type ImpressionMethod = 'upload_3d_scans' | '3shape_communicate' | 'other' | 'impression_pickup';
export type PrescriptionChoice = 'not_applicable' | 'yes' | null;
export type PrescriptionCorrectionChoice = 'not_applicable' | 'improve' | 'correct' | null;
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
export declare const emptyPrescription: PrescriptionAnswers;
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
export type CaseValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: string[];
};
export declare function requiredAttachmentsFor(config: CaseConfig): AttachmentType[];
export declare function hasPackagesStep(config: CaseConfig): boolean;
export declare function isValidCase(draft: CaseDraft, config: CaseConfig): CaseValidationResult;
