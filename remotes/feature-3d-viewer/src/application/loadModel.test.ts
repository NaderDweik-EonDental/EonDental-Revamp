import { describe, expect, it, vi } from 'vitest';
import { loadModel, type ViewerApi } from './loadModel.js';
import type { ViewerConfig, ViewerLoadRequest } from '../domain/viewerRules.js';

const config: ViewerConfig = {
  allowedFormats: ['stl', 'ply'],
  defaultCamera: 'front',
};

const validRequest: ViewerLoadRequest = {
  upperModelName: 'upper-arch.stl',
  lowerModelName: 'lower-arch.stl',
  format: 'stl',
  camera: 'front',
};

function fakeApi(): ViewerApi {
  return {
    load: vi.fn(async (request) => ({
      modelId: 'model_1',
      modelName: [request.upperModelName, request.lowerModelName]
        .filter(Boolean)
        .join(' + '),
      upperModelName: request.upperModelName,
      lowerModelName: request.lowerModelName,
      triangles: 12000,
    })),
  };
}

describe('loadModel', () => {
  it('rejects disallowed formats without calling the API', async () => {
    const api = fakeApi();
    const result = await loadModel(
      { ...validRequest, format: 'obj' },
      config,
      api,
    );

    expect(result.ok).toBe(false);
    expect(api.load).not.toHaveBeenCalled();
  });

  it('rejects non-STL formats that cannot render in the viewport', async () => {
    const api = fakeApi();
    const result = await loadModel(
      { ...validRequest, format: 'ply' },
      config,
      api,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('STL'))).toBe(true);
    }
    expect(api.load).not.toHaveBeenCalled();
  });

  it('loads a valid model through the API', async () => {
    const api = fakeApi();
    const result = await loadModel(validRequest, config, api);

    expect(api.load).toHaveBeenCalledWith(validRequest);
    expect(result).toEqual({
      ok: true,
      model: {
        modelId: 'model_1',
        modelName: 'upper-arch.stl + lower-arch.stl',
        upperModelName: 'upper-arch.stl',
        lowerModelName: 'lower-arch.stl',
        triangles: 12000,
      },
    });
  });
});
