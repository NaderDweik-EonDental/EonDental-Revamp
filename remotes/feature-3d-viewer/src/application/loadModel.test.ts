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

  it('rejects PLY when the STL-only version is assigned', async () => {
    const api = fakeApi();
    const result = await loadModel(
      { ...validRequest, format: 'ply' },
      { allowedFormats: ['stl'], defaultCamera: 'front' },
      api,
    );

    expect(result.ok).toBe(false);
    expect(api.load).not.toHaveBeenCalled();
  });

  it('loads a PLY request when the dual-format version allows it', async () => {
    const api = fakeApi();
    const plyRequest = {
      ...validRequest,
      upperModelName: 'upper-arch.ply',
      lowerModelName: 'lower-arch.ply',
      format: 'ply' as const,
    };
    const result = await loadModel(plyRequest, config, api);

    expect(result.ok).toBe(true);
    expect(api.load).toHaveBeenCalledWith(plyRequest);
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
