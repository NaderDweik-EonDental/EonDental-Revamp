import { useEffect, useRef, useState } from 'react';
import {
  loadModel,
  type LoadModelResult,
  type ViewerApi,
} from '../2-application/loadModel.js';
import type {
  CameraPreset,
  ModelFormat,
  ViewerConfig,
  ViewerLoadRequest,
} from '../1-domain/viewerRules.js';
import { loadDefaultArchFiles } from './defaultArchFiles.js';

export type ArchFiles = {
  upper: File | null;
  lower: File | null;
};

export function useViewer(args: { config: ViewerConfig; api: ViewerApi }) {
  const [request, setRequest] = useState<ViewerLoadRequest>({
    upperModelName: '',
    lowerModelName: '',
    format: 'stl',
    camera: args.config.defaultCamera,
  });
  const [files, setFiles] = useState<ArchFiles>({ upper: null, lower: null });
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LoadModelResult | null>(null);
  const [meshReady, setMeshReady] = useState(false);
  const defaultsStarted = useRef(false);

  useEffect(() => {
    if (defaultsStarted.current) return;
    defaultsStarted.current = true;

    let cancelled = false;

    async function applyDefaults() {
      setLoading(true);
      try {
        const defaults = await loadDefaultArchFiles();
        if (cancelled) return;

        const nextRequest: ViewerLoadRequest = {
          upperModelName: defaults.upper.name,
          lowerModelName: defaults.lower.name,
          format: 'stl',
          camera: args.config.defaultCamera,
        };

        setFiles(defaults);
        setRequest(nextRequest);

        const result = await loadModel(nextRequest, args.config, args.api);
        if (cancelled) return;
        setLastResult(result);
        setMeshReady(result.ok);
      } catch (error) {
        if (cancelled) return;
        setLastResult({
          ok: false,
          errors: [
            error instanceof Error
              ? error.message
              : 'Failed to load default arch models',
          ],
        });
        setMeshReady(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void applyDefaults();
    return () => {
      cancelled = true;
    };
  }, [args.api, args.config]);

  return {
    request,
    files,
    setUpperModel: (file: File | null, fallbackName = '') => {
      setFiles((current) => ({ ...current, upper: file }));
      setRequest((current) => ({
        ...current,
        upperModelName: file?.name ?? fallbackName,
        format: 'stl',
      }));
      setMeshReady(false);
    },
    setLowerModel: (file: File | null, fallbackName = '') => {
      setFiles((current) => ({ ...current, lower: file }));
      setRequest((current) => ({
        ...current,
        lowerModelName: file?.name ?? fallbackName,
        format: 'stl',
      }));
      setMeshReady(false);
    },
    setFormat: (format: ModelFormat) => setRequest((c) => ({ ...c, format })),
    setCamera: (camera: CameraPreset) => setRequest((c) => ({ ...c, camera })),
    loading,
    lastResult,
    meshReady,
    setMeshReady,
    load: async () => {
      setLoading(true);
      try {
        const result = await loadModel(request, args.config, args.api);
        setLastResult(result);
        setMeshReady(result.ok && Boolean(files.upper || files.lower));
        return result;
      } finally {
        setLoading(false);
      }
    },
  };
}
