type CaseSubmissionFooterProps = {
    mode: 'patient' | 'step' | 'summary' | 'complete';
    canSave?: boolean;
    canNext?: boolean;
    submitting?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onSubmitNewCase?: () => void;
};
export declare function CaseSubmissionFooter({ mode, canSave, canNext, submitting, onCancel, onSave, onPrevious, onNext, onSubmitNewCase, }: CaseSubmissionFooterProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=CaseSubmissionFooter.d.ts.map