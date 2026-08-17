import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react';
import type { ViewerApi } from '../2-application/loadModel.js';
import type {
  CameraPreset,
  ModelFormat,
  ViewerConfig,
} from '../1-domain/viewerRules.js';
import { TeethViewport } from './TeethViewport.js';
import { useViewer } from './useViewer.js';
import './viewer.css';

const CAMERAS: { id: CameraPreset; label: string; hint: string }[] = [
  { id: 'front', label: 'Front', hint: 'Facial' },
  { id: 'occlusal', label: 'Occlusal', hint: 'Top-down' },
  { id: 'lateral', label: 'Lateral', hint: 'Side' },
];

const FORMAT_LABEL: Record<ModelFormat, string> = {
  stl: 'STL',
  ply: 'PLY',
  obj: 'OBJ',
};

function acceptForFormats(formats: ModelFormat[]): string {
  const tokens: string[] = [];
  if (formats.includes('stl')) tokens.push('.stl', 'model/stl', 'application/sla');
  if (formats.includes('ply')) tokens.push('.ply', 'application/x-ply');
  if (formats.includes('obj')) tokens.push('.obj');
  return tokens.join(',');
}

function formatFromFileName(name: string): ModelFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.stl')) return 'stl';
  if (lower.endsWith('.ply')) return 'ply';
  if (lower.endsWith('.obj')) return 'obj';
  return null;
}

export function ViewerScreen(props: {
  config: ViewerConfig;
  api: ViewerApi;
  version: string | null;
}) {
  const {
    request,
    files,
    setUpperModel,
    setLowerModel,
    setFormat,
    setCamera,
    loading,
    lastResult,
    meshReady,
    setMeshReady,
    load,
  } = useViewer(props);

  const [meshTriangles, setMeshTriangles] = useState(0);
  const [viewportError, setViewportError] = useState<string | null>(null);
  const upperInputRef = useRef<HTMLInputElement>(null);
  const lowerInputRef = useRef<HTMLInputElement>(null);

  const formats = props.config.allowedFormats.filter((f): f is ModelFormat =>
    ['stl', 'ply', 'obj'].includes(f),
  );
  const meshAccept = acceptForFormats(formats);
  const meshHint =
    formats.length > 1
      ? formats.map((f) => FORMAT_LABEL[f]).join(' or ')
      : FORMAT_LABEL[formats[0] ?? 'stl'];

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setViewportError(null);
    const result = await load();
    if (result.ok && (files.upper || files.lower)) {
      setMeshReady(true);
    }
  };

  const onArchPick =
    (arch: 'upper' | 'lower') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) return;
      const format = formatFromFileName(file.name);
      if (!format || !formats.includes(format)) {
        setViewportError(`Please upload a ${meshHint} file for this version.`);
        return;
      }
      setViewportError(null);
      setFormat(format);
      if (arch === 'upper') setUpperModel(file);
      else setLowerModel(file);
    };

  const canLoad =
    Boolean(request.upperModelName.trim() || request.lowerModelName.trim()) &&
    Boolean(files.upper || files.lower);

  return (
    <section className="viewer">
      <div className="viewer__shell">
        <aside className="viewer__rail">
          <div className="viewer__brand">
            <p className="viewer__eyebrow">Intraoral scan</p>
            <h1 className="viewer__brand-title">
              3D
              <span>Viewer</span>
            </h1>
            {props.version ? (
              <p className="viewer__version">v{props.version}</p>
            ) : null}
            <p className="viewer__brand-copy">
              Demo upper and lower arches load by default. Replace them or
              inspect the WebGL viewport.
            </p>
          </div>

          <form className="viewer__form" onSubmit={onSubmit}>
            <div className="viewer__fields">
              <ArchUpload
                label={`Upper arch ${meshHint}`}
                fileName={request.upperModelName}
                inputRef={upperInputRef}
                onPick={onArchPick('upper')}
                swatch="upper"
                accept={meshAccept}
                hint={meshHint}
              />
              <ArchUpload
                label={`Lower arch ${meshHint}`}
                fileName={request.lowerModelName}
                inputRef={lowerInputRef}
                onPick={onArchPick('lower')}
                swatch="lower"
                accept={meshAccept}
                hint={meshHint}
              />

              <fieldset className="viewer__field">
                <legend className="viewer__label">Format</legend>
                <div className="viewer__chip-row" role="radiogroup" aria-label="Format">
                  {formats.map((format) => {
                    const selected = request.format === format;
                    return (
                      <button
                        key={format}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={
                          selected
                            ? 'viewer__chip viewer__chip--selected'
                            : 'viewer__chip'
                        }
                        onClick={() => setFormat(format)}
                      >
                        {FORMAT_LABEL[format]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="viewer__field">
                <legend className="viewer__label">Camera</legend>
                <div className="viewer__chip-row" role="radiogroup" aria-label="Camera">
                  {CAMERAS.map((camera) => {
                    const selected = request.camera === camera.id;
                    return (
                      <button
                        key={camera.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={
                          selected
                            ? 'viewer__chip viewer__chip--selected'
                            : 'viewer__chip'
                        }
                        onClick={() => setCamera(camera.id)}
                      >
                        <strong>{camera.label}</strong>
                        <small>{camera.hint}</small>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <footer className="viewer__footer">
              <button
                type="submit"
                className="viewer__submit"
                disabled={loading || !canLoad}
              >
                {loading ? 'Loading…' : 'Load models into viewport'}
              </button>
            </footer>
          </form>
        </aside>

        <div className="viewer__main">
          <div
            className={
              meshReady
                ? 'viewer__stage viewer__stage--loaded'
                : 'viewer__stage'
            }
            role="img"
            aria-label={`Viewport · ${request.camera}`}
          >
            <TeethViewport
              upperFile={files.upper}
              lowerFile={files.lower}
              camera={request.camera}
              active={meshReady}
              onStats={({ triangles }) => setMeshTriangles(triangles)}
              onError={setViewportError}
            />

            {!meshReady ? (
              <p className="viewer__stage-empty">
                Upload upper and/or lower STL files, then load them into the
                viewport. Drag to orbit · scroll to zoom.
              </p>
            ) : null}

            <div className="viewer__hud">
              <span className="viewer__hud-pill">
                Viewport · {request.camera}
              </span>
              {meshReady && meshTriangles > 0 ? (
                <span className="viewer__hud-pill viewer__hud-pill--ok">
                  {meshTriangles.toLocaleString()} tris
                </span>
              ) : null}
              {files.upper ? (
                <span className="viewer__hud-pill viewer__hud-pill--upper">
                  Upper
                </span>
              ) : null}
              {files.lower ? (
                <span className="viewer__hud-pill viewer__hud-pill--lower">
                  Lower
                </span>
              ) : null}
            </div>
          </div>

          {viewportError ? (
            <div className="viewer__result viewer__result--error" role="alert">
              <p>{viewportError}</p>
            </div>
          ) : null}

          {lastResult ? (
            <div
              className={
                lastResult.ok
                  ? 'viewer__result viewer__result--ok'
                  : 'viewer__result viewer__result--error'
              }
              role="status"
            >
              {lastResult.ok ? (
                <p>
                  Loaded <strong>{lastResult.model.modelName}</strong>
                  <span>
                    {meshTriangles > 0
                      ? `${meshTriangles.toLocaleString()} mesh triangles`
                      : `${lastResult.model.triangles.toLocaleString()} triangles`}{' '}
                    · {lastResult.model.modelId}
                  </span>
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

function ArchUpload(props: {
  label: string;
  fileName: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
  swatch: 'upper' | 'lower';
  accept: string;
  hint: string;
}) {
  return (
    <div className="viewer__field">
      <span className="viewer__label">{props.label}</span>
      <button
        type="button"
        className={
          props.fileName
            ? 'viewer__dropzone viewer__dropzone--filled'
            : 'viewer__dropzone'
        }
        onClick={() => props.inputRef.current?.click()}
      >
        <span
          className={`viewer__dropzone-icon viewer__dropzone-icon--${props.swatch}`}
          aria-hidden="true"
        />
        <span className="viewer__dropzone-text">
          {props.fileName ? (
            <>
              <strong>{props.fileName}</strong>
              <small>Click to replace mesh</small>
            </>
          ) : (
            <>
              <strong>Choose {props.swatch} mesh</strong>
              <small>{props.hint} mesh</small>
            </>
          )}
        </span>
      </button>
      <input
        ref={props.inputRef}
        className="viewer__file-input"
        type="file"
        accept={props.accept}
        onChange={props.onPick}
        tabIndex={-1}
        aria-label={props.label}
      />
    </div>
  );
}
