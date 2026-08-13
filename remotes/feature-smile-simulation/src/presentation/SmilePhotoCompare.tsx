import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { ToothShade } from '../domain/simulationRules.js';

type SmilePhotoCompareProps = {
  photoFile: File | null;
  afterImageUrl: string | null;
  processing: boolean;
  error: string | null;
  targetShade: ToothShade;
  includeWhitening: boolean;
  aiReady: boolean;
};

const SLIDER_MIN = 8;
const SLIDER_MAX = 92;

export function SmilePhotoCompare({
  photoFile,
  afterImageUrl,
  processing,
  error,
  targetShade,
  includeWhitening,
  aiReady,
}: SmilePhotoCompareProps) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [slider, setSlider] = useState(50);
  const [dragging, setDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderId = useId();

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    const next = Math.round(ratio * 100);
    setSlider(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, next)));
  }, []);

  const onSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSliderFromClientX(event.clientX);
  };

  const onSliderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateSliderFromClientX(event.clientX);
  };

  const onSliderPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  useEffect(() => {
    if (!photoFile) {
      setBeforeUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setBeforeUrl(objectUrl);
    setSlider(50);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  if (!photoFile || !beforeUrl) {
    return (
      <div className="smile-sim__compare smile-sim__compare--empty">
        <p>
          Upload a smile photo, then run simulation. Hugging Face will generate
          a realistic after preview with corrected teeth.
        </p>
      </div>
    );
  }

  const showCompare = Boolean(afterImageUrl) && !processing;

  return (
    <div className="smile-sim__compare">
      <div className="smile-sim__compare-head">
        <div>
          <p className="smile-sim__compare-title">Before / After AI preview</p>
          <p className="smile-sim__compare-sub">
            Target {targetShade}
            {includeWhitening ? ' · whitening on' : ''}
            {aiReady ? ' · Hugging Face' : ' · HF token missing'}
          </p>
        </div>
        {processing ? (
          <span className="smile-sim__compare-badge">
            Generating smile with Hugging Face…
          </span>
        ) : showCompare ? (
          <span className="smile-sim__compare-badge smile-sim__compare-badge--ok">
            Ready
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="smile-sim__compare-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="smile-sim__compare-stage">
        {!showCompare ? (
          <figure className="smile-sim__panel">
            <img src={beforeUrl} alt="Uploaded smile photo before enhancement" />
            <figcaption>
              {processing
                ? 'Generating after preview…'
                : 'Before · run simulation to generate after'}
            </figcaption>
          </figure>
        ) : (
          <>
            <div
              ref={sliderRef}
              className={
                dragging
                  ? 'smile-sim__slider smile-sim__slider--dragging'
                  : 'smile-sim__slider'
              }
              style={{ '--split': `${slider}%` } as CSSProperties}
              onPointerDown={onSliderPointerDown}
              onPointerMove={onSliderPointerMove}
              onPointerUp={onSliderPointerUp}
              onPointerCancel={onSliderPointerUp}
              role="slider"
              aria-valuemin={SLIDER_MIN}
              aria-valuemax={SLIDER_MAX}
              aria-valuenow={slider}
              aria-label="Before and after comparison"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  setSlider((v) => Math.max(SLIDER_MIN, v - 2));
                } else if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  setSlider((v) => Math.min(SLIDER_MAX, v + 2));
                }
              }}
            >
              <img
                className="smile-sim__slider-before"
                src={beforeUrl}
                alt="Before smile simulation"
                draggable={false}
              />
              <img
                className="smile-sim__slider-after"
                src={afterImageUrl!}
                alt="After AI smile simulation"
                draggable={false}
              />
              <div className="smile-sim__slider-handle" aria-hidden="true" />
            </div>
            <label className="smile-sim__slider-control" htmlFor={sliderId}>
              <span>Before</span>
              <input
                id={sliderId}
                type="range"
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
              />
              <span>After</span>
            </label>
            <div className="smile-sim__compare-labels">
              <span>Before</span>
              <span>After</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
