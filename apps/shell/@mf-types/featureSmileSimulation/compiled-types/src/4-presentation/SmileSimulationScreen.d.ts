import type { SmileSimulationApi } from '../2-application/runSimulation.js';
import { type SmileSimulationConfig } from '../1-domain/simulationRules.js';
import './smileSimulation.css';
export declare function SmileSimulationScreen(props: {
    config: SmileSimulationConfig;
    api: SmileSimulationApi;
    version: string | null;
}): import("react").JSX.Element;
