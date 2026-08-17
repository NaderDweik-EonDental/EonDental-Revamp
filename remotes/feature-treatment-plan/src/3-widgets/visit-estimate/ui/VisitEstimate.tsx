import { estimateVisitWeeks, type PlanDraft } from '@/entities/treatment-plan';

export function VisitEstimate(props: { draft: PlanDraft }) {
  const weeks = estimateVisitWeeks(props.draft);
  const visits = Math.max(props.draft.stages.length, weeks > 0 ? 1 : 0);

  return (
    <aside className="tp__estimate">
      <h3>Visit estimate</h3>
      <p>
        About <strong>{weeks} weeks</strong> across {visits} chairside
        {visits === 1 ? ' visit' : ' visits'} for the current sequence.
      </p>
    </aside>
  );
}
