import { describe, expect, it, vi } from 'vitest';
import { runSimulation, type SmileSimulationApi } from './runSimulation.js';
import type {
  SmileSimulationConfig,
  SmileSimulationDraft,
} from '../domain/simulationRules.js';

const config: SmileSimulationConfig = {
  maxShadeOptions: 3,
  allowWhiteningPreview: true,
};

const validDraft: SmileSimulationDraft = {
  patientId: 'pat_001',
  sourcePhotoName: 'smile.jpg',
  targetShade: 'A2',
  includeWhiteningPreview: false,
};

function fakeApi(): SmileSimulationApi {
  return {
    run: vi.fn(async (draft) => ({
      simulationId: 'sim_1',
      patientId: draft.patientId,
      previewUrl: '/previews/sim_1.png',
    })),
  };
}

describe('runSimulation', () => {
  it('rejects invalid drafts without calling the API', async () => {
    const api = fakeApi();
    const result = await runSimulation(
      { ...validDraft, patientId: '' },
      config,
      api,
    );

    expect(result.ok).toBe(false);
    expect(api.run).not.toHaveBeenCalled();
  });

  it('runs a valid simulation through the API', async () => {
    const api = fakeApi();
    const result = await runSimulation(validDraft, config, api);

    expect(api.run).toHaveBeenCalledWith(validDraft);
    expect(result).toEqual({
      ok: true,
      simulation: {
        simulationId: 'sim_1',
        patientId: 'pat_001',
        previewUrl: '/previews/sim_1.png',
      },
    });
  });
});
