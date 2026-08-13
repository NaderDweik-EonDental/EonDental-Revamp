import { type RunSimulationResult, type SmileSimulationApi } from '../application/runSimulation.js';
import type { SmileSimulationConfig, SmileSimulationDraft, ToothShade } from '../domain/simulationRules.js';
export declare function useSmileSimulation(args: {
    config: SmileSimulationConfig;
    api: SmileSimulationApi;
}): {
    draft: SmileSimulationDraft;
    sourcePhoto: File | null;
    afterImageUrl: string | null;
    previewError: string | null;
    aiModelUsed: string | null;
    aiReady: boolean;
    setPatientId: (patientId: string) => void;
    setSourcePhoto: (file: File | null) => void;
    setSourcePhotoName: (sourcePhotoName: string) => void;
    setTargetShade: (targetShade: ToothShade) => void;
    setIncludeWhiteningPreview: (includeWhiteningPreview: boolean) => void;
    running: boolean;
    lastResult: RunSimulationResult | null;
    run: () => Promise<{
        ok: true;
        simulation: import("../application/runSimulation.js").SimulationResult;
    } | {
        ok: false;
        errors: string[];
    }>;
};
//# sourceMappingURL=useSmileSimulation.d.ts.map