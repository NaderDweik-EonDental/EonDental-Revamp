import {
  isValidSimulation,
  type SmileSimulationConfig,
  type SmileSimulationDraft,
} from '../1-domain/simulationRules.js';

export interface SimulationResult {
  simulationId: string;
  patientId: string;
  previewUrl: string;
}

export interface SmileSimulationApi {
  run(draft: SmileSimulationDraft): Promise<SimulationResult>;
}

export type RunSimulationResult =
  | { ok: true; simulation: SimulationResult }
  | { ok: false; errors: string[] };

export async function runSimulation(
  draft: SmileSimulationDraft,
  config: SmileSimulationConfig,
  api: SmileSimulationApi,
): Promise<RunSimulationResult> {
  const validation = isValidSimulation(draft, config);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  const simulation = await api.run(draft);
  return { ok: true, simulation };
}
