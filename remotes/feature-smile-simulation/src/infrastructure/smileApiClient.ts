import type {
  SimulationResult,
  SmileSimulationApi,
} from '../application/runSimulation.js';
import type { SmileSimulationDraft } from '../domain/simulationRules.js';

export function createInMemorySmileApi(): SmileSimulationApi {
  let sequence = 0;
  return {
    async run(draft: SmileSimulationDraft): Promise<SimulationResult> {
      sequence += 1;
      return {
        simulationId: `sim_${sequence}`,
        patientId: draft.patientId,
        previewUrl: `/previews/sim_${sequence}.png`,
      };
    },
  };
}
