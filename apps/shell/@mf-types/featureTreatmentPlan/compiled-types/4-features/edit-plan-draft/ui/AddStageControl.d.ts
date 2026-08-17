import { type StageKind } from '../../../5-entities/treatment-plan/index.js';
export declare function AddStageControl(props: {
    available: StageKind[];
    disabled: boolean;
    onAdd: (kind: StageKind) => void;
}): import("react").JSX.Element;
