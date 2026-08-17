import {
  isValidViewerRequest,
  type ViewerConfig,
  type ViewerLoadRequest,
} from '../1-domain/viewerRules.js';

export interface LoadedModel {
  modelId: string;
  modelName: string;
  upperModelName: string;
  lowerModelName: string;
  triangles: number;
}

export interface ViewerApi {
  load(request: ViewerLoadRequest): Promise<LoadedModel>;
}

export type LoadModelResult =
  | { ok: true; model: LoadedModel }
  | { ok: false; errors: string[] };

export async function loadModel(
  request: ViewerLoadRequest,
  config: ViewerConfig,
  api: ViewerApi,
): Promise<LoadModelResult> {
  const validation = isValidViewerRequest(request, config);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const model = await api.load(request);
  return { ok: true, model };
}
