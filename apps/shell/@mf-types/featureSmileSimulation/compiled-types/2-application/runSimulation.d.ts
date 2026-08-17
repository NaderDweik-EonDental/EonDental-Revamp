import { type SmileSimulationConfig, type SmileSimulationDraft } from '../1-domain/simulationRules.js';
export interface SimulationResult {
    simulationId: string;
    patientId: string;
    previewUrl: string;
}
export interface SmileSimulationApi {
    run(draft: SmileSimulationDraft): Promise<SimulationResult>;
}
export type RunSimulationResult = {
    ok: true;
    simulation: SimulationResult;
} | {
    ok: false;
    errors: string[];
};
export declare function runSimulation(draft: SmileSimulationDraft, config: SmileSimulationConfig, api: SmileSimulationApi): Promise<RunSimulationResult>;
//# sourceMappingURL=runSimulation.d.ts.map