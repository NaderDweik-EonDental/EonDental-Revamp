import { useState } from 'react';
import type { PlanConfig, StageKind } from '@/entities/treatment-plan';
import { hasVisitEstimate } from '@/entities/treatment-plan';
import {
  AddStageControl,
  addStage,
  availableStageKinds,
  emptyPlanDraft,
  PatientField,
  removeStage,
  setPatientId,
} from '@/features/edit-plan-draft';
import {
  submitPlan,
  type PlanApi,
  type SubmitPlanResult,
} from '@/features/submit-plan';
import { PlanTimeline } from '@/widgets/plan-timeline';
import { VisitEstimate } from '@/widgets/visit-estimate';
import '@/shared/ui/styles.css';

export function PlannerPage(props: {
  config: PlanConfig;
  api: PlanApi;
  version: string | null;
}) {
  const [draft, setDraft] = useState(emptyPlanDraft);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitPlanResult | null>(null);

  const atCap = draft.stages.length >= props.config.maxStages;
  const available = availableStageKinds(draft);

  async function onSubmit() {
    setRunning(true);
    try {
      const result = await submitPlan(draft, props.config, props.api);
      setLastResult(result);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="tp">
      <div className="tp__shell">
        <aside className="tp__brand">
          <p className="tp__eyebrow">Chairside</p>
          <h1 className="tp__brand-title">
            Treatment
            <span>plan</span>
          </h1>
          <p className="tp__version">
            Version {props.version ?? '—'} · max {props.config.maxStages} stages
          </p>
        </aside>

        <div className="tp__body">
          <PatientField
            value={draft.patientId}
            onChange={(patientId) => setDraft((current) => setPatientId(current, patientId))}
          />

          <label className="tp__field">
            <span>Add stage</span>
            <AddStageControl
              available={available}
              disabled={atCap}
              onAdd={(kind: StageKind) =>
                setDraft((current) => addStage(current, kind, props.config.maxStages))
              }
            />
          </label>

          <PlanTimeline
            draft={draft}
            onRemove={(stageId) =>
              setDraft((current) => removeStage(current, stageId))
            }
          />

          {hasVisitEstimate(props.config) ? <VisitEstimate draft={draft} /> : null}

          <div className="tp__actions">
            <button
              type="button"
              className="tp__submit"
              disabled={running}
              onClick={() => void onSubmit()}
            >
              {running ? 'Saving…' : 'Save plan'}
            </button>
            {lastResult?.ok ? (
              <p className="tp__status tp__status--ok">
                Saved {lastResult.plan.planId} for {lastResult.plan.patientId}
              </p>
            ) : null}
            {lastResult && !lastResult.ok ? (
              <p className="tp__status tp__status--err">
                {lastResult.errors.join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
