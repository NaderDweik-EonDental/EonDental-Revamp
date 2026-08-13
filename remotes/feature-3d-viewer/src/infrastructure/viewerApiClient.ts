import type { LoadedModel, ViewerApi } from '../application/loadModel.js';
import type { ViewerLoadRequest } from '../domain/viewerRules.js';

export function createInMemoryViewerApi(): ViewerApi {
  let sequence = 0;
  return {
    async load(request: ViewerLoadRequest): Promise<LoadedModel> {
      sequence += 1;
      const parts = [request.upperModelName, request.lowerModelName].filter(
        (name) => name.trim().length > 0,
      );
      return {
        modelId: `model_${sequence}`,
        modelName: parts.join(' + '),
        upperModelName: request.upperModelName,
        lowerModelName: request.lowerModelName,
        triangles: 8000 + sequence * 100,
      };
    },
  };
}
