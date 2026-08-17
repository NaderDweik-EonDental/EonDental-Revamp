import { type PlanConfig } from '../../../5-entities/treatment-plan/index.js';
import { type PlanApi } from '../../../4-features/submit-plan/index.js';
import '../../../6-shared/ui/styles.css';
export declare function PlannerPage(props: {
    config: PlanConfig;
    api: PlanApi;
    version: string | null;
}): import("react").JSX.Element;
