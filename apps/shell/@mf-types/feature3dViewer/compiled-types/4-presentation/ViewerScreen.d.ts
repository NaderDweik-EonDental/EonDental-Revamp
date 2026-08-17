import type { ViewerApi } from '../2-application/loadModel.js';
import type { ViewerConfig } from '../1-domain/viewerRules.js';
import './viewer.css';
export declare function ViewerScreen(props: {
    config: ViewerConfig;
    api: ViewerApi;
    version: string | null;
}): import("react").JSX.Element;
