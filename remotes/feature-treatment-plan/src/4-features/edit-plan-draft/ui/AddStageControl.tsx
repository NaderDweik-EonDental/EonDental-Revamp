import { STAGE_CATALOG, type StageKind } from '@/entities/treatment-plan';

export function AddStageControl(props: {
  available: StageKind[];
  disabled: boolean;
  onAdd: (kind: StageKind) => void;
}) {
  if (props.available.length === 0) {
    return <p className="tp__empty">Every catalog stage is already on this plan.</p>;
  }

  return (
    <div className="tp__stage-picker">
      {props.available.map((kind) => {
        const definition = STAGE_CATALOG.find((entry) => entry.kind === kind);
        return (
          <button
            key={kind}
            type="button"
            className="tp__chip"
            disabled={props.disabled}
            onClick={() => props.onAdd(kind)}
          >
            {definition?.label ?? kind}
          </button>
        );
      })}
    </div>
  );
}
