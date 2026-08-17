import { type PlanDraft } from '../../../5-entities/treatment-plan/index.js';
export declare function PlanTimeline(props: {
    draft: PlanDraft;
    onRemove: (stageId: string) => void;
}): import("react").JSX.Element;
