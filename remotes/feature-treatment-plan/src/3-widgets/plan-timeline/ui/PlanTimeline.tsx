import { stageDefinition, type PlanDraft } from '@/entities/treatment-plan';

export function PlanTimeline(props: {
  draft: PlanDraft;
  onRemove: (stageId: string) => void;
}) {
  if (props.draft.stages.length === 0) {
    return <p className="tp__empty">Add a stage to start the sequence.</p>;
  }

  return (
    <ol className="tp__timeline">
      {props.draft.stages.map((stage, index) => {
        const definition = stageDefinition(stage.kind);
        return (
          <li key={stage.id}>
            <span className="tp__step-index">{index + 1}</span>
            <div>
              <h3>{definition.label}</h3>
              <p>{definition.summary}</p>
            </div>
            <button
              type="button"
              className="tp__remove"
              onClick={() => props.onRemove(stage.id)}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ol>
  );
}
