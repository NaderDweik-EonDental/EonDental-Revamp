import {
  useId,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react';
import type { SmileSimulationApi } from '../2-application/runSimulation.js';
import {
  availableShadesFor,
  hasShadeAndWhiteningControls,
  type SmileSimulationConfig,
  type ToothShade,
} from '../1-domain/simulationRules.js';
import { SmilePhotoCompare } from './SmilePhotoCompare.js';
import { useSmileSimulation } from './useSmileSimulation.js';
import './smileSimulation.css';

const SHADE_SWATCH: Record<ToothShade, string> = {
  A1: '#f4efe6',
  A2: '#ebe1d0',
  A3: '#e0d0b5',
  B1: '#f7f4ec',
  B2: '#efe6d4',
};

export function SmileSimulationScreen(props: {
  config: SmileSimulationConfig;
  api: SmileSimulationApi;
  version: string | null;
}) {
  const {
    draft,
    sourcePhoto,
    afterImageUrl,
    previewError,
    aiModelUsed,
    aiReady,
    setPatientId,
    setSourcePhoto,
    setTargetShade,
    setIncludeWhiteningPreview,
    running,
    lastResult,
    run,
  } = useSmileSimulation(props);

  const shades = availableShadesFor(props.config);
  const showShadeAndWhitening = hasShadeAndWhiteningControls(props.config);
  const patientId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await run();
  };

  const onPhotoPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setSourcePhoto(file);
  };

  const canRun =
    draft.patientId.trim().length > 0 &&
    draft.sourcePhotoName.trim().length > 0 &&
    Boolean(sourcePhoto);

  return (
    <section className="smile-sim">
      <div className="smile-sim__shell">
        <aside className="smile-sim__brand" aria-label="Smile simulation">
          <p className="smile-sim__eyebrow">Clinical preview</p>
          <h1 className="smile-sim__brand-title">
            Smile
            <span>Simulation</span>
          </h1>
          {props.version ? (
            <p className="smile-sim__version">v{props.version}</p>
          ) : null}
          <p className="smile-sim__brand-copy">
            A demo smile photo is loaded by default. Replace it or run Hugging
            Face for a realistic after preview with corrected, aligned teeth.
          </p>
          <div className="smile-sim__brand-glow" aria-hidden="true" />
        </aside>

        <div className="smile-sim__main">
          <form className="smile-sim__form" onSubmit={onSubmit}>
            <div className="smile-sim__controls">
              <label className="smile-sim__field" htmlFor={patientId}>
                <span className="smile-sim__label">Patient ID</span>
                <input
                  id={patientId}
                  value={draft.patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PT-10482"
                  required
                  autoComplete="off"
                />
              </label>

              <div className="smile-sim__field">
                <span className="smile-sim__label">Source photo</span>
                <button
                  type="button"
                  className={
                    draft.sourcePhotoName
                      ? 'smile-sim__dropzone smile-sim__dropzone--filled'
                      : 'smile-sim__dropzone'
                  }
                  onClick={() => photoInputRef.current?.click()}
                >
                  <span className="smile-sim__dropzone-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path
                        d="M4 16.5V7.8A2.8 2.8 0 0 1 6.8 5h10.4A2.8 2.8 0 0 1 20 7.8v8.7a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 16.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <circle cx="9" cy="10" r="1.4" fill="currentColor" />
                      <path
                        d="m7.5 16 3.2-3.4a1.2 1.2 0 0 1 1.7 0L20 20"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="smile-sim__dropzone-text">
                    {draft.sourcePhotoName ? (
                      <>
                        <strong>{draft.sourcePhotoName}</strong>
                        <small>Click to replace photo</small>
                      </>
                    ) : (
                      <>
                        <strong>Upload smile photo</strong>
                        <small>JPG or PNG · face-forward smile</small>
                      </>
                    )}
                  </span>
                </button>
                <input
                  ref={photoInputRef}
                  className="smile-sim__file-input"
                  type="file"
                  accept="image/*"
                  onChange={onPhotoPick}
                  tabIndex={-1}
                  aria-label="Choose source photo"
                />
              </div>

              {showShadeAndWhitening ? (
                <fieldset className="smile-sim__field smile-sim__shades">
                  <legend className="smile-sim__label">Target shade</legend>
                  <div
                    className="smile-sim__shade-grid"
                    role="radiogroup"
                    aria-label="Target shade"
                  >
                    {shades.map((shade) => {
                      const selected = draft.targetShade === shade;
                      return (
                        <button
                          key={shade}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={
                            selected
                              ? 'smile-sim__shade smile-sim__shade--selected'
                              : 'smile-sim__shade'
                          }
                          style={{ '--shade': SHADE_SWATCH[shade] } as CSSProperties}
                          onClick={() => setTargetShade(shade)}
                        >
                          <span className="smile-sim__shade-chip" aria-hidden="true" />
                          <span className="smile-sim__shade-name">{shade}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {showShadeAndWhitening ? (
                <label className="smile-sim__toggle">
                  <input
                    type="checkbox"
                    checked={draft.includeWhiteningPreview}
                    onChange={(e) => setIncludeWhiteningPreview(e.target.checked)}
                  />
                  <span className="smile-sim__toggle-ui" aria-hidden="true" />
                  <span className="smile-sim__toggle-copy">
                    <strong>Include whitening preview</strong>
                    <small>Ask the model to brighten toward the target shade</small>
                  </span>
                </label>
              ) : null}
            </div>

            <div className="smile-sim__viewport">
              <SmilePhotoCompare
                photoFile={sourcePhoto}
                afterImageUrl={afterImageUrl}
                processing={running}
                error={previewError}
                targetShade={draft.targetShade}
                includeWhitening={draft.includeWhiteningPreview}
                showShadeAndWhitening={showShadeAndWhitening}
                aiReady={aiReady}
              />
            </div>

            <footer className="smile-sim__footer">
              <p className="smile-sim__footer-hint">
                {sourcePhoto
                  ? 'Run simulation to generate an AI after image with aligned teeth, then drag the slider.'
                  : 'Upload a smile photo to begin.'}
              </p>
              <button
                type="submit"
                className="smile-sim__submit"
                disabled={running || !canRun || !aiReady}
              >
                {running ? 'Generating with Hugging Face…' : 'Run AI simulation'}
              </button>
            </footer>
          </form>

          {!aiReady ? (
            <div className="smile-sim__result smile-sim__result--error" role="alert">
              <p>
                Set <code>VITE_HF_TOKEN</code> in{' '}
                <code>remotes/feature-smile-simulation/.env</code> (free token
                from{' '}
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                >
                  huggingface.co/settings/tokens
                </a>
                ), then restart the smile-simulation remote.
              </p>
            </div>
          ) : null}

          {lastResult ? (
            <div
              className={
                lastResult.ok
                  ? 'smile-sim__result smile-sim__result--ok'
                  : 'smile-sim__result smile-sim__result--error'
              }
              role="status"
            >
              {lastResult.ok ? (
                <p>
                  Simulation <strong>{lastResult.simulation.simulationId}</strong>{' '}
                  ready
                  {afterImageUrl
                    ? ` · Hugging Face after image${aiModelUsed ? ` (${aiModelUsed})` : ''}`
                    : ''}
                </p>
              ) : (
                <ul>
                  {lastResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
