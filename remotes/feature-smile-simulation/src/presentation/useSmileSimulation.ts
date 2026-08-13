import { useEffect, useRef, useState } from 'react';
import {
  runSimulation,
  type RunSimulationResult,
  type SmileSimulationApi,
} from '../application/runSimulation.js';
import type {
  SmileSimulationConfig,
  SmileSimulationDraft,
  ToothShade,
} from '../domain/simulationRules.js';
import {
  generateSmileWithHuggingFace,
  isHuggingFaceConfigured,
} from '../infrastructure/huggingfaceSmileClient.js';
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
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RunSimulationResult | null>(
    null,
  );
  const defaultsStarted = useRef(false);

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
    };
  }, []);

  return {
    draft,
    sourcePhoto,
    afterImageUrl,
    previewError,
    aiModelUsed,
    aiReady: isHuggingFaceConfigured(),
    setPatientId: (patientId: string) =>
      setDraft((c) => ({ ...c, patientId })),
    setSourcePhoto: (file: File | null) => {
      setSourcePhoto(file);
      setDraft((c) => ({ ...c, sourcePhotoName: file?.name ?? '' }));
      setAfterImageUrl(null);
      setPreviewError(null);
      setAiModelUsed(null);
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
          setAfterImageUrl(null);
          setAiModelUsed(null);
          return result;
        }

        if (!sourcePhoto) {
          setPreviewError(
            'Upload a smile photo before running the AI simulation.',
          );
          setAfterImageUrl(null);
          setAiModelUsed(null);
          return result;
        }

        try {
          const generated = await generateSmileWithHuggingFace({
            photo: sourcePhoto,
            targetShade: draft.targetShade,
            includeWhitening: draft.includeWhiteningPreview,
            patientId: draft.patientId,
          });
          setAfterImageUrl(generated.afterImageUrl);
          setAiModelUsed(generated.model);
        } catch (error) {
          setAfterImageUrl(null);
          setAiModelUsed(null);
          setPreviewError(
            error instanceof Error
              ? error.message
              : 'Hugging Face smile simulation failed',
          );
        }

        return result;
      } finally {
        setRunning(false);
      }
    },
  };
}
