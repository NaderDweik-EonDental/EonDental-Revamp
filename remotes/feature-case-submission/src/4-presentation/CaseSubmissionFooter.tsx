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

export function CaseSubmissionFooter({
  mode,
  canSave = false,
  canNext = false,
  submitting = false,
  onCancel,
  onSave,
  onPrevious,
  onNext,
  onSubmitNewCase,
}: CaseSubmissionFooterProps) {
  if (mode === 'complete') {
    return (
      <footer className="case-submission__footer case-submission__footer--end">
        <button
          type="button"
          className="case-submission__btn case-submission__btn--primary"
          onClick={onSubmitNewCase}
        >
          Submit new case
        </button>
      </footer>
    );
  }

  return (
    <footer className="case-submission__footer">
      {mode === 'patient' ? (
        <button
          type="button"
          className="case-submission__btn case-submission__btn--ghost"
          onClick={onCancel}
        >
          Cancel Submission
        </button>
      ) : (
        <button
          type="button"
          className="case-submission__btn case-submission__btn--ghost"
          onClick={onPrevious}
        >
          Previous
        </button>
      )}

      {mode === 'patient' ? (
        <button
          type="button"
          className="case-submission__btn case-submission__btn--primary"
          onClick={onSave}
          disabled={!canSave}
        >
          Save <span aria-hidden="true">›</span>
        </button>
      ) : mode === 'step' ? (
        <button
          type="button"
          className="case-submission__btn case-submission__btn--primary"
          onClick={onNext}
          disabled={!canNext || submitting}
        >
          Next <span aria-hidden="true">›</span>
        </button>
      ) : null}
    </footer>
  );
}
