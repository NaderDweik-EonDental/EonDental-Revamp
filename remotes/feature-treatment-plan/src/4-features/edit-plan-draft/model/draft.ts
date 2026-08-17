import type { PlanDraft, StageKind } from '@/entities/treatment-plan';
import { STAGE_CATALOG } from '@/entities/treatment-plan';

export function emptyPlanDraft(): PlanDraft {
  return {
    patientId: 'PT-DEMO',
    stages: [{ id: 'stage_records', kind: 'records' }],
  };
}

export function setPatientId(draft: PlanDraft, patientId: string): PlanDraft {
  return { ...draft, patientId };
}

export function addStage(
  draft: PlanDraft,
  kind: StageKind,
  maxStages: number,
): PlanDraft {
  if (draft.stages.length >= maxStages) {
    return draft;
  }
  if (draft.stages.some((stage) => stage.kind === kind)) {
    return draft;
  }

  return {
    ...draft,
    stages: [
      ...draft.stages,
      { id: `stage_${kind}_${draft.stages.length + 1}`, kind },
    ],
  };
}

export function removeStage(draft: PlanDraft, stageId: string): PlanDraft {
  return {
    ...draft,
    stages: draft.stages.filter((stage) => stage.id !== stageId),
  };
}

export function availableStageKinds(draft: PlanDraft): StageKind[] {
  const used = new Set(draft.stages.map((stage) => stage.kind));
  return STAGE_CATALOG.map((stage) => stage.kind).filter(
    (kind) => !used.has(kind),
  );
}
