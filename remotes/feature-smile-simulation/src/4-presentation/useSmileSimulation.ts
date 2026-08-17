import { useEffect, useRef, useState } from 'react';
import {
  runSimulation,
  type RunSimulationResult,
  type SmileSimulationApi,
} from '../2-application/runSimulation.js';
import type {
  SmileSimulationConfig,
  SmileSimulationDraft,
  ToothShade,
} from '../1-domain/simulationRules.js';
import { loadDefaultSmilePhoto } from './defaultSmilePhoto.js';

export function useSmileSimulation(args: {
  config: SmileSimulationConfig;
  api: SmileSimulationApi;
}) {
  const [draft, setDraft] = useState<SmileSimulationDraft>({
    patientId: '',
    sourcePhotoName: '',
    targetShade: 'A1',
    includeWhiteningPreview: false,
  });
  const [sourcePhoto, setSourcePhoto] = useState<File | null>(null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunSimulationResult | null>(
    null,
  );
  const defaultsStarted = useRef(false);
  const afterUrlRef = useRef<string | null>(null);

  function replaceAfterUrl(next: string | null) {
    if (afterUrlRef.current) {
      URL.revokeObjectURL(afterUrlRef.current);
      afterUrlRef.current = null;
    }
    afterUrlRef.current = next;
    setAfterImageUrl(next);
  }

  useEffect(() => {
    if (defaultsStarted.current) return;
    defaultsStarted.current = true;

    let cancelled = false;

    async function applyDefaultPhoto() {
      try {
        const photo = await loadDefaultSmilePhoto();
        if (cancelled) return;
        setSourcePhoto(photo);
        setDraft((current) => ({
          ...current,
          sourcePhotoName: photo.name,
          patientId: current.patientId || 'PT-DEMO',
        }));
      } catch (error) {
        if (cancelled) return;
        setPreviewError(
          error instanceof Error
            ? error.message
            : 'Failed to load default smile photo',
        );
      }
    }

    void applyDefaultPhoto();
    return () => {
      cancelled = true;
      if (afterUrlRef.current) {
        URL.revokeObjectURL(afterUrlRef.current);
      }
    };
  }, []);

  return {
    draft,
    sourcePhoto,
    afterImageUrl,
    previewError,
    setPatientId: (patientId: string) =>
      setDraft((c) => ({ ...c, patientId })),
    setSourcePhoto: (file: File | null) => {
      setSourcePhoto(file);
      setDraft((c) => ({ ...c, sourcePhotoName: file?.name ?? '' }));
      replaceAfterUrl(null);
      setPreviewError(null);
    },
    setSourcePhotoName: (sourcePhotoName: string) =>
      setDraft((c) => ({ ...c, sourcePhotoName })),
    setTargetShade: (targetShade: ToothShade) =>
      setDraft((c) => ({ ...c, targetShade })),
    setIncludeWhiteningPreview: (includeWhiteningPreview: boolean) =>
      setDraft((c) => ({ ...c, includeWhiteningPreview })),
    running,
    lastResult,
    run: async () => {
      setRunning(true);
      setPreviewError(null);
      try {
        const result = await runSimulation(draft, args.config, args.api);
        setLastResult(result);

        if (!result.ok) {
          replaceAfterUrl(null);
          return result;
        }

        if (!sourcePhoto) {
          setPreviewError(
            'Upload a smile photo before running the simulation.',
          );
          replaceAfterUrl(null);
          return result;
        }

        replaceAfterUrl(URL.createObjectURL(sourcePhoto));
        return result;
      } finally {
        setRunning(false);
      }
    },
  };
}
