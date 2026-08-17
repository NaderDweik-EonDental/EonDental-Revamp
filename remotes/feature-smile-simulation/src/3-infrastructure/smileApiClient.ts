import type {
  SimulationResult,
  SmileSimulationApi,
} from '../2-application/runSimulation.js';
import type { SmileSimulationDraft } from '../1-domain/simulationRules.js';

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
