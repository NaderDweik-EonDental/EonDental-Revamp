import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { CaseApi } from '../2-application/submitCase.js';
import {
  hasPackagesStep,
  requiredAttachmentsFor,
  type ArchSelection,
  type CaseConfig,
  type PrescriptionAnswers,
  type PrescriptionChoice,
  type PrescriptionCorrectionChoice,
} from '../1-domain/caseRules.js';
import { useCaseSubmission } from './useCaseSubmission.js';
import { CaseSubmissionFooter } from './CaseSubmissionFooter.js';
import { PHOTO_SECTIONS } from './photoTiles.js';
import { MOCK_IMPRESSION_VISITS } from './impressionVisits.js';
import {
  CameraIcon,
  CheckCircleIcon,
  DurationIcon,
  ImpressionIcon,
  InfoIcon,
  LinkIcon,
  PackageIcon,
  PrescriptionIcon,
  RefinementIcon,
  RetainerIcon,
  RevisionIcon,
  StepsIcon,
  SummaryIcon,
  UploadIcon,
} from './icons.js';
import './caseSubmission.css';

export interface CaseSubmissionScreenProps {
  config: CaseConfig;
  api: CaseApi;
  version: string | null;
}

const REQUIRED_PHOTO_TILE_KEYS = ['right-buccal', 'frontal', 'left-buccal'];

const STEP_ICONS = {
  patient: InfoIcon,
  packages: PackageIcon,
  photos: CameraIcon,
  impressions: ImpressionIcon,
  prescription: PrescriptionIcon,
  summary: SummaryIcon,
  complete: CheckCircleIcon,
} as const;

const ALL_STEPS = [
  { key: 'patient', label: 'Patient Information' },
  { key: 'packages', label: 'Packages' },
  { key: 'photos', label: 'Photos & X-rays' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'prescription', label: 'Prescription' },
  { key: 'summary', label: 'Summary' },
  { key: 'complete', label: 'Submission Complete' },
] as const;

type StepKey = (typeof ALL_STEPS)[number]['key'];

function formatQuantity(value: number | 'unlimited'): string {
  return value === 'unlimited' ? 'Unlimited' : `Up to ${value}`;
}

function choiceLabel(value: PrescriptionChoice): string {
  if (value === 'yes') return 'Yes';
  if (value === 'not_applicable') return 'No / Not Applicable';
  return '—';
}

function correctionLabel(value: PrescriptionCorrectionChoice): string {
  if (value === 'improve') return 'Improve';
  if (value === 'correct') return 'Correct';
  if (value === 'not_applicable') return 'No / Not Applicable';
  return '—';
}

function archLabel(value: ArchSelection): string {
  if (value === 'upper_lower') return 'Upper & Lower';
  if (value === 'upper') return 'Upper';
  if (value === 'lower') return 'Lower';
  return '—';
}

interface ChoiceFieldProps {
  legend: string;
  hint: string;
  value: PrescriptionChoice;
  onChange: (value: PrescriptionChoice) => void;
  yesLabel?: string;
}

function ChoiceField({ legend, hint, value, onChange, yesLabel = 'Yes' }: ChoiceFieldProps) {
  return (
    <div className="case-submission__objective">
      <div className="case-submission__objective-legend">
        {legend} <span aria-hidden="true">*</span>
      </div>
      <p className="case-submission__objective-hint">{hint}</p>
      <div className="case-submission__radio-row">
        <label className="case-submission__radio">
          <input
            type="radio"
            checked={value === 'not_applicable'}
            onChange={() => onChange('not_applicable')}
          />
          No/Not Applicable
        </label>
        <label className="case-submission__radio">
          <input type="radio" checked={value === 'yes'} onChange={() => onChange('yes')} />
          {yesLabel}
        </label>
      </div>
    </div>
  );
}

interface CorrectionFieldProps {
  legend: string;
  hint: string;
  value: PrescriptionCorrectionChoice;
  onChange: (value: PrescriptionCorrectionChoice) => void;
  improveLabel: string;
  correctLabel: string;
}

function CorrectionField({
  legend,
  hint,
  value,
  onChange,
  improveLabel,
  correctLabel,
}: CorrectionFieldProps) {
  return (
    <div className="case-submission__objective">
      <div className="case-submission__objective-legend">
        {legend} <span aria-hidden="true">*</span>
      </div>
      <p className="case-submission__objective-hint">{hint}</p>
      <div className="case-submission__radio-row">
        <label className="case-submission__radio">
          <input
            type="radio"
            checked={value === 'not_applicable'}
            onChange={() => onChange('not_applicable')}
          />
          No/Not Applicable
        </label>
        <label className="case-submission__radio">
          <input type="radio" checked={value === 'improve'} onChange={() => onChange('improve')} />
          {improveLabel}
        </label>
        <label className="case-submission__radio">
          <input type="radio" checked={value === 'correct'} onChange={() => onChange('correct')} />
          {correctLabel}
        </label>
      </div>
    </div>
  );
}

function isPrescriptionComplete(p: PrescriptionAnswers): boolean {
  return (
    p.chiefComplaint.trim().length > 0 &&
    p.arch !== null &&
    p.hasPrimaryTeeth !== null &&
    p.teethMovementRestrictions !== null &&
    p.attachmentRestrictions !== null &&
    p.crossbite !== null &&
    p.extraction !== null &&
    p.classIIIII !== null &&
    p.midline !== null
  );
}

export function CaseSubmissionScreen({
  config,
  api,
  version,
}: CaseSubmissionScreenProps) {
  const {
    draft,
    setPatientId,
    addAttachment,
    removeAttachment,
    selectPackage,
    setImpressionMethod,
    setImpressionVisit,
    setPrescription,
    submit,
    submitting,
    lastResult,
    clearResult,
  } = useCaseSubmission({ config, api });

  const [lastName, setLastName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [dob, setDob] = useState('');
  const [smileWhiteReferral, setSmileWhiteReferral] = useState('');

  const packagesEnabled = hasPackagesStep(config);
  const required = useMemo(() => requiredAttachmentsFor(config), [config]);

  const STEPS = useMemo(
    () => ALL_STEPS.filter((step) => packagesEnabled || step.key !== 'packages'),
    [packagesEnabled],
  );

  const FINAL_STEP_INDEX = STEPS.length - 1;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (lastResult?.ok) {
      setActiveStep(FINAL_STEP_INDEX);
    }
  }, [lastResult, FINAL_STEP_INDEX]);

  const stepKey: StepKey = STEPS[activeStep].key;

  const requiredPresent = useMemo(() => {
    const presentTypes = new Set(draft.attachments.map((a) => a.type));
    return required.every((type) => presentTypes.has(type));
  }, [draft.attachments, required]);

  const requiredTilesPresent = useMemo(() => {
    const presentKeys = new Set(
      draft.attachments.map((a) => `${a.type}:${a.fileName}`),
    );
    return PHOTO_SECTIONS.flatMap((section) => section.tiles)
      .filter((tile) => REQUIRED_PHOTO_TILE_KEYS.includes(tile.key))
      .every((tile) => presentKeys.has(`${tile.type}:${tile.fileName}`));
  }, [draft.attachments]);

  const canAdvanceFromPatientInfo =
    draft.patientId.trim().length > 0 &&
    lastName.trim().length > 0 &&
    shippingAddress.trim().length > 0 &&
    smileWhiteReferral.trim().length > 0;

  const canAdvanceFromPackages = !packagesEnabled || draft.selectedPackageId !== null;

  const canAdvanceFromPhotos = useMemo(() => {
    if (!requiredPresent || !requiredTilesPresent) return false;
    if (draft.attachments.length > config.maxAttachments) return false;
    return draft.attachments.every((a) => a.fileName.trim().length > 0);
  }, [config.maxAttachments, draft.attachments, requiredPresent, requiredTilesPresent]);

  const canAdvanceFromImpressions = useMemo(() => {
    if (!draft.impressionMethod) return false;
    if (draft.impressionMethod === '3shape_communicate') {
      return draft.impressionVisitId !== null;
    }
    if (draft.impressionMethod === 'upload_3d_scans') {
      return draft.attachments.some((a) => a.type === 'scan');
    }
    return true;
  }, [draft.impressionMethod, draft.impressionVisitId, draft.attachments]);

  const canAdvanceFromPrescription = useMemo(
    () => isPrescriptionComplete(draft.prescription),
    [draft.prescription],
  );

  function isTileSelected(type: string, fileName: string): boolean {
    return draft.attachments.some((a) => a.type === type && a.fileName === fileName);
  }

  function toggleTile(type: 'photo' | 'xray', fileName: string) {
    const idx = draft.attachments.findIndex((a) => a.type === type && a.fileName === fileName);
    if (idx >= 0) {
      removeAttachment(idx);
      return;
    }
    if (draft.attachments.length >= config.maxAttachments) return;
    addAttachment(type, fileName);
  }

  function addScan(fileName: string) {
    if (draft.attachments.length >= config.maxAttachments) return;
    addAttachment('scan', fileName);
  }

  function canAdvanceFromStep(key: StepKey): boolean {
    switch (key) {
      case 'patient':
        return canAdvanceFromPatientInfo;
      case 'packages':
        return canAdvanceFromPackages;
      case 'photos':
        return canAdvanceFromPhotos;
      case 'impressions':
        return canAdvanceFromImpressions;
      case 'prescription':
        return canAdvanceFromPrescription;
      default:
        return true;
    }
  }

  function goBack() {
    setActiveStep((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (!canAdvanceFromStep(stepKey)) return;
    setActiveStep((i) => Math.min(FINAL_STEP_INDEX, i + 1));
  }

  async function onSubmitAtSummary(event: FormEvent) {
    event.preventDefault();
    clearResult();
    await submit();
  }

  const scanAttachments = draft.attachments.filter((a) => a.type === 'scan');
  const selectedPackage = config.packages?.find((p) => p.id === draft.selectedPackageId) ?? null;
  const selectedVisit = MOCK_IMPRESSION_VISITS.find((v) => v.id === draft.impressionVisitId) ?? null;

  const dontApplyList = useMemo(() => {
    const items: string[] = [];
    if (draft.prescription.extraction === 'not_applicable') items.push('Extraction');
    if (draft.prescription.attachmentRestrictions === 'not_applicable') {
      items.push('Attachment restrictions');
    }
    if (draft.prescription.teethMovementRestrictions === 'not_applicable') {
      items.push('Teeth movement restrictions');
    }
    return items;
  }, [draft.prescription]);

  return (
    <section className="case-submission case-submission--stepper">
      <div className="case-submission__layout">
        <aside className="case-submission__sidebar">
          <div className="case-submission__brand">
            <div className="case-submission__brand-title">Aligner</div>
            <div className="case-submission__brand-subtitle">Case Submission</div>
          </div>

          <nav className="case-submission__steps" aria-label="Case steps">
            {STEPS.map((step, index) => {
              const state =
                index < activeStep
                  ? 'done'
                  : index === activeStep
                    ? 'active'
                    : index === FINAL_STEP_INDEX && lastResult?.ok
                      ? 'active'
                      : 'pending';
              const Icon = STEP_ICONS[step.key];

              return (
                <button
                  key={step.key}
                  type="button"
                  className={[
                    'case-submission__step',
                    `case-submission__step--${state}`,
                    index === STEPS.length - 1 ? 'case-submission__step--final' : '',
                  ].join(' ')}
                  onClick={() => {
                    if (index <= activeStep || (index === FINAL_STEP_INDEX && lastResult?.ok)) {
                      setActiveStep(index);
                    }
                  }}
                  disabled={index > activeStep && !(index === FINAL_STEP_INDEX && lastResult?.ok)}
                >
                  <span className="case-submission__step-badge">
                    <Icon />
                  </span>
                  <span className="case-submission__step-label">{step.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="case-submission__main">
          <header className="case-submission__main-header">
            <div>
              <h1 className="case-submission__title">Case submission</h1>
              {version ? <p className="case-submission__meta">v{version}</p> : null}
            </div>
            <div className="case-submission__meta-block">
              {draft.patientId ? (
                <>
                  <p className="case-submission__patient-name">
                    {draft.patientId} {lastName}
                  </p>
                  <p className="case-submission__meta">Max attachments: {config.maxAttachments}</p>
                </>
              ) : (
                <p className="case-submission__meta">
                  Max attachments: {config.maxAttachments}
                  {config.requireXray ? ' · X-ray required' : ''}
                </p>
              )}
            </div>
          </header>

          <div className="case-submission__body">
          <div className="case-submission__step-background" aria-hidden="true" />

          {stepKey === 'patient' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Patient Information</h2>
              <div className="case-submission__form case-submission__form--patient">
                <label className="case-submission__label">
                  First Name <span aria-hidden="true">*</span>
                  <input
                    value={draft.patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </label>

                <label className="case-submission__label">
                  Last Name <span aria-hidden="true">*</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </label>

                <label className="case-submission__label case-submission__label--shipping">
                  Shipping Address <span aria-hidden="true">*</span>
                  <div className="case-submission__shipping-row">
                    <select
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                    >
                      <option value="">Select…</option>
                      <option value="default">Default address</option>
                    </select>
                    <button type="button" className="case-submission__link-btn" onClick={() => {}}>
                      + Add new address
                    </button>
                  </div>
                </label>

                <label className="case-submission__label">
                  Date of Birth (Optional)
                  <input
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    autoComplete="off"
                  />
                </label>

                <label className="case-submission__label">
                  Smile White Referral <span aria-hidden="true">*</span>
                  <input
                    value={smileWhiteReferral}
                    onChange={(e) => setSmileWhiteReferral(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </label>
              </div>
            </div>
          ) : null}

          {stepKey === 'packages' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Choose a package</h2>
              <div className="case-submission__package-grid">
                {(config.packages ?? []).map((pkg) => {
                  const selected = draft.selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      className={[
                        'case-submission__package-card',
                        selected ? 'case-submission__package-card--selected' : '',
                      ].join(' ')}
                      onClick={() => selectPackage(pkg.id)}
                    >
                      <div className="case-submission__package-head">
                        <span
                          className={`case-submission__package-radio ${selected ? 'case-submission__package-radio--on' : ''}`}
                          aria-hidden="true"
                        />
                        <span className={`case-submission__package-badge case-submission__package-badge--${pkg.accent}`}>
                          {pkg.label}
                        </span>
                      </div>
                      <p className="case-submission__package-desc">{pkg.description}</p>
                      <ul className="case-submission__package-features">
                        <li>
                          <StepsIcon /> {formatQuantity(pkg.maxAlignerSteps)} aligner steps
                        </li>
                        <li>
                          <DurationIcon />{' '}
                          {pkg.durationMonths === 'unlimited' ? 'Unlimited' : `${pkg.durationMonths} months`}
                        </li>
                        <li>
                          <RefinementIcon /> {formatQuantity(pkg.refinements)} refinement(s)
                        </li>
                        <li>
                          <RevisionIcon /> {formatQuantity(pkg.tsRevisions)} TS revision(s)
                        </li>
                        <li>
                          <RetainerIcon /> {formatQuantity(pkg.retainerSets)} retainer set(s)
                        </li>
                      </ul>
                      <span className="case-submission__package-info" title={pkg.code}>
                        <InfoIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="case-submission__footnote">
                *Total refinement steps cannot exceed the number of steps in the package selected.
              </p>
            </div>
          ) : null}

          {stepKey === 'photos' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Photos &amp; X-Rays</h2>
              <p className="case-submission__hint">
                <span aria-hidden="true">*</span> Required
              </p>

              {PHOTO_SECTIONS.map((section) => (
                <div className="case-submission__photo-section" key={section.title}>
                  <h3 className="case-submission__photo-section-title">{section.title}</h3>
                  <div className="case-submission__photo-grid">
                    {section.tiles.map((tile) => {
                      const selected = isTileSelected(tile.type, tile.fileName);
                      const disabled =
                        !selected && draft.attachments.length >= config.maxAttachments;
                      return (
                        <button
                          key={tile.key}
                          type="button"
                          className={[
                            'case-submission__photo-tile',
                            selected ? 'case-submission__photo-tile--selected' : '',
                          ].join(' ')}
                          onClick={() => toggleTile(tile.type === 'xray' ? 'xray' : 'photo', tile.fileName)}
                          disabled={disabled}
                        >
                          <div className="case-submission__photo-tile-head">
                            <span>
                              {tile.label} {tile.required ? <span aria-hidden="true">*</span> : null}
                            </span>
                            <UploadIcon />
                          </div>
                          {tile.recommended ? (
                            <span className="case-submission__tag case-submission__tag--recommended">
                              Recommended
                            </span>
                          ) : null}
                          {tile.beta ? (
                            <span className="case-submission__tag case-submission__tag--beta">Beta</span>
                          ) : null}
                          <div
                            className={[
                              'case-submission__photo-img',
                              selected ? 'case-submission__photo-img--filled' : '',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {stepKey === 'impressions' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Impressions</h2>
              <div className="case-submission__impressions-layout">
                <div className="case-submission__impressions-options">
                  <p className="case-submission__paragraph">
                    Select how you would like to submit your impressions:
                  </p>

                  <div className="case-submission__impression-group">
                    <h3>Digital</h3>
                    <label className="case-submission__radio">
                      <input
                        type="radio"
                        checked={draft.impressionMethod === 'upload_3d_scans'}
                        onChange={() => setImpressionMethod('upload_3d_scans')}
                      />
                      Upload 3D Scans
                    </label>
                    <label className="case-submission__radio">
                      <input
                        type="radio"
                        checked={draft.impressionMethod === '3shape_communicate'}
                        onChange={() => setImpressionMethod('3shape_communicate')}
                      />
                      3shape communicate
                    </label>
                    <label className="case-submission__radio">
                      <input
                        type="radio"
                        checked={draft.impressionMethod === 'other'}
                        onChange={() => setImpressionMethod('other')}
                      />
                      Other
                    </label>
                  </div>

                  <div className="case-submission__impression-group">
                    <h3>Physical</h3>
                    <label className="case-submission__radio">
                      <input
                        type="radio"
                        checked={draft.impressionMethod === 'impression_pickup'}
                        onChange={() => setImpressionMethod('impression_pickup')}
                      />
                      Impression Pickup
                    </label>
                  </div>
                </div>

                <div className="case-submission__impressions-panel">
                  {draft.impressionMethod === '3shape_communicate' ? (
                    <>
                      <div className="case-submission__integration-badge">
                        <LinkIcon /> 3shape <strong>Connected</strong>
                      </div>
                      <p className="case-submission__paragraph">Patient Visits</p>
                      <div className="case-submission__visit-list">
                        {MOCK_IMPRESSION_VISITS.map((visit) => (
                          <label key={visit.id} className="case-submission__visit-row">
                            <input
                              type="radio"
                              disabled={!visit.scans}
                              checked={draft.impressionVisitId === visit.id}
                              onChange={() => setImpressionVisit(visit.id)}
                            />
                            <span>
                              <span className="case-submission__visit-name">{visit.patientName}</span>
                              <span className="case-submission__visit-date">
                                Created at: {visit.createdAt}
                              </span>
                              {visit.scans ? (
                                <span className="case-submission__visit-scans">
                                  <strong>Scans</strong> {visit.scans.join('  ')}
                                </span>
                              ) : (
                                <span className="case-submission__visit-scans">
                                  No scans with FileType &apos;stl&apos; found.
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {draft.impressionMethod === 'upload_3d_scans' ? (
                    <>
                      <button
                        type="button"
                        className="case-submission__upload-box"
                        onClick={() => addScan(`Scan_${scanAttachments.length + 1}.stl`)}
                        disabled={draft.attachments.length >= config.maxAttachments}
                      >
                        <UploadIcon />
                        Upload 3D scan files (.stl)
                      </button>
                      {scanAttachments.length > 0 ? (
                        <ul className="case-submission__attachments-list">
                          {scanAttachments.map((scan) => {
                            const idx = draft.attachments.indexOf(scan);
                            return (
                              <li key={scan.fileName} className="case-submission__attachment-row">
                                {scan.fileName}
                                <button type="button" onClick={() => removeAttachment(idx)}>
                                  Remove
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </>
                  ) : null}

                  {draft.impressionMethod === 'other' || draft.impressionMethod === 'impression_pickup' ? (
                    <p className="case-submission__paragraph">
                      We&apos;ll coordinate this with your practice directly — no upload needed here.
                    </p>
                  ) : null}

                  {!draft.impressionMethod ? (
                    <p className="case-submission__paragraph">
                      Choose an impression method to continue.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {stepKey === 'prescription' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Prescription</h2>

              <div className="case-submission__card">
                <h3 className="case-submission__card-title">General Details</h3>
                <div className="case-submission__form case-submission__form--two-col">
                  <label className="case-submission__label">
                    Chief Complaint <span aria-hidden="true">*</span>
                    <textarea
                      rows={3}
                      value={draft.prescription.chiefComplaint}
                      onChange={(e) => setPrescription('chiefComplaint', e.target.value)}
                    />
                  </label>
                  <label className="case-submission__label">
                    Additional Notes
                    <textarea
                      rows={3}
                      value={draft.prescription.additionalNotes}
                      onChange={(e) => setPrescription('additionalNotes', e.target.value)}
                    />
                  </label>

                  <div className="case-submission__objective">
                    <div className="case-submission__objective-legend">
                      Arch <span aria-hidden="true">*</span>
                    </div>
                    <div className="case-submission__radio-row case-submission__radio-row--stacked">
                      <label className="case-submission__radio">
                        <input
                          type="radio"
                          checked={draft.prescription.arch === 'upper_lower'}
                          onChange={() => setPrescription('arch', 'upper_lower')}
                        />
                        Upper &amp; Lower
                      </label>
                      <label className="case-submission__radio">
                        <input
                          type="radio"
                          checked={draft.prescription.arch === 'upper'}
                          onChange={() => setPrescription('arch', 'upper')}
                        />
                        Upper
                      </label>
                      <label className="case-submission__radio">
                        <input
                          type="radio"
                          checked={draft.prescription.arch === 'lower'}
                          onChange={() => setPrescription('arch', 'lower')}
                        />
                        Lower
                      </label>
                    </div>
                  </div>

                  <div className="case-submission__objective">
                    <div className="case-submission__objective-legend">
                      Does the patient have any remaining primary teeth?{' '}
                      <span aria-hidden="true">*</span>
                    </div>
                    <div className="case-submission__radio-row">
                      <label className="case-submission__radio">
                        <input
                          type="radio"
                          checked={draft.prescription.hasPrimaryTeeth === true}
                          onChange={() => setPrescription('hasPrimaryTeeth', true)}
                        />
                        Yes
                      </label>
                      <label className="case-submission__radio">
                        <input
                          type="radio"
                          checked={draft.prescription.hasPrimaryTeeth === false}
                          onChange={() => setPrescription('hasPrimaryTeeth', false)}
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="case-submission__card">
                <h3 className="case-submission__card-title">Treatment Objectives</h3>
                <div className="case-submission__form case-submission__form--two-col">
                  <ChoiceField
                    legend="Teeth movement restrictions"
                    hint="Are there any teeth you prefer not to move? (If yes, select teeth)"
                    value={draft.prescription.teethMovementRestrictions}
                    onChange={(v) => setPrescription('teethMovementRestrictions', v)}
                  />
                  <ChoiceField
                    legend="Extraction"
                    hint="Are there any extractions planned for this case (excluding wisdom teeth)? (If yes, select teeth)"
                    value={draft.prescription.extraction}
                    onChange={(v) => setPrescription('extraction', v)}
                  />
                  <ChoiceField
                    legend="Attachment restrictions"
                    hint="Are there any teeth where you'd prefer not to add attachments? (If yes, select teeth)"
                    value={draft.prescription.attachmentRestrictions}
                    onChange={(v) => setPrescription('attachmentRestrictions', v)}
                  />
                  <CorrectionField
                    legend="Class II/III"
                    hint="Do you want to address the Class II/III malocclusion?"
                    value={draft.prescription.classIIIII}
                    onChange={(v) => setPrescription('classIIIII', v)}
                    improveLabel="Improve class II/III"
                    correctLabel="Correct class II/III"
                  />
                  <ChoiceField
                    legend="Crossbite/scissor bite"
                    hint="Do you want to address the crossbite/scissor bite?"
                    value={draft.prescription.crossbite}
                    onChange={(v) => setPrescription('crossbite', v)}
                    yesLabel="Yes, address the crossbite / scissor bite"
                  />
                  <CorrectionField
                    legend="Midline correction"
                    hint="Do you want to address the midline in this case?"
                    value={draft.prescription.midline}
                    onChange={(v) => setPrescription('midline', v)}
                    improveLabel="Improve midline"
                    correctLabel="Correct midline"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {stepKey === 'summary' ? (
            <div className="case-submission__content">
              <h2 className="case-submission__content-title">Summary</h2>

              <div className="case-submission__summary">
                <div className="case-submission__summary-meta">
                  <span>
                    <strong>Date of Birth:</strong> {dob || '—'}
                  </span>
                  <span>
                    <strong>Smile White Referral:</strong> {smileWhiteReferral || '—'}
                  </span>
                  <span>
                    <strong>Shipping Address:</strong>{' '}
                    {shippingAddress === 'default' ? 'Default address' : '—'}
                  </span>
                  {selectedPackage ? (
                    <span>
                      <strong>Package:</strong> {selectedPackage.label}
                    </span>
                  ) : null}
                </div>

                <div className="case-submission__summary-columns">
                  <div>
                    <p className="case-submission__summary-heading">Chief Complaint</p>
                    <div className="case-submission__summary-box">
                      {draft.prescription.chiefComplaint || '—'}
                    </div>
                  </div>
                  <div>
                    <p className="case-submission__summary-heading">Additional Notes</p>
                    <div className="case-submission__summary-box">
                      {draft.prescription.additionalNotes || '—'}
                    </div>
                  </div>
                </div>

                <div className="case-submission__summary-row-inline">
                  <span>
                    <strong>Arch:</strong> {archLabel(draft.prescription.arch)}
                  </span>
                  <span>
                    <strong>Treatment type:</strong> Aligner
                  </span>
                </div>

                <div className="case-submission__summary-block">
                  <p className="case-submission__summary-heading">Treatment Objectives</p>

                  {dontApplyList.length > 0 ? (
                    <div className="case-submission__dont-apply">
                      <p>Don&apos;t apply the following treatments (based on doctor)</p>
                      <div className="case-submission__dont-apply-list">
                        {dontApplyList.map((item) => (
                          <span key={item} className="case-submission__dont-apply-item">
                            ✕ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <SummaryObjective
                    title="Crossbite/scissor bite"
                    question="Do you want to address the crossbite/scissor bite?"
                    answer={choiceLabel(draft.prescription.crossbite)}
                  />
                  <SummaryObjective
                    title="Class II/III"
                    question="Do you want to address the Class II/III malocclusion?"
                    answer={correctionLabel(draft.prescription.classIIIII)}
                  />
                  <SummaryObjective
                    title="Midline correction"
                    question="Do you want to address the midline in this case?"
                    answer={correctionLabel(draft.prescription.midline)}
                  />
                </div>

                <div className="case-submission__summary-block">
                  <p className="case-submission__summary-heading">Impressions</p>
                  <p className="case-submission__paragraph">
                    {draft.impressionMethod === '3shape_communicate' && selectedVisit
                      ? `3shape communicate — ${selectedVisit.patientName}`
                      : draft.impressionMethod === 'upload_3d_scans'
                        ? `Uploaded scans (${scanAttachments.length})`
                        : draft.impressionMethod === 'impression_pickup'
                          ? 'Impression pickup requested'
                          : draft.impressionMethod === 'other'
                            ? 'Other arrangement'
                            : '—'}
                  </p>
                </div>

                <div className="case-submission__summary-block">
                  <p className="case-submission__summary-heading">Attachments</p>
                  <p className="case-submission__paragraph">
                    {draft.attachments.length
                      ? draft.attachments.map((a) => a.fileName).join(', ')
                      : '—'}
                  </p>
                </div>
              </div>

              {lastResult && !lastResult.ok ? (
                <div className="case-submission__error-block" role="alert">
                  <strong>Cannot submit</strong>
                  <ul>
                    {lastResult.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form className="case-submission__submit-form" onSubmit={onSubmitAtSummary}>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit case'}
                </button>
              </form>
            </div>
          ) : null}

          {stepKey === 'complete' ? (
            <div className="case-submission__content case-submission__content--complete">
              {lastResult?.ok ? (
                <div className="case-submission__success" role="status">
                  <div className="case-submission__success-icon">
                    <CheckCircleIcon width={22} height={22} />
                  </div>
                  <p className="case-submission__success-title">Case submitted successfully</p>
                  <p className="case-submission__success-sub">
                    Case <strong>{lastResult.case.caseId}</strong> for {lastResult.case.patientId}
                  </p>

                  <div className="case-submission__success-actions">
                    <button type="button" className="case-submission__success-link">
                      <UploadIcon /> Download prescription form
                    </button>
                    <button type="button" className="case-submission__success-link">
                      <SummaryIcon /> Review cases
                    </button>
                  </div>
                </div>
              ) : (
                <p className="case-submission__paragraph">Submit to reach completion.</p>
              )}
            </div>
          ) : null}
          </div>

          <CaseSubmissionFooter
            mode={
              stepKey === 'complete'
                ? 'complete'
                : activeStep === 0
                  ? 'patient'
                  : stepKey === 'summary'
                    ? 'summary'
                    : 'step'
            }
            canSave={canAdvanceFromPatientInfo}
            canNext={canAdvanceFromStep(stepKey)}
            submitting={submitting}
            onCancel={() => {}}
            onSave={goNext}
            onPrevious={goBack}
            onNext={goNext}
            onSubmitNewCase={() => {
              clearResult();
              setLastName('');
              setShippingAddress('');
              setDob('');
              setSmileWhiteReferral('');
              setActiveStep(0);
            }}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryObjective({
  title,
  question,
  answer,
}: {
  title: string;
  question: string;
  answer: string;
}): ReactNode {
  return (
    <div className="case-submission__summary-objective">
      <p className="case-submission__summary-objective-title">{title}</p>
      <p className="case-submission__summary-objective-question">{question}</p>
      <p className="case-submission__summary-objective-answer">• {answer}</p>
    </div>
  );
}
