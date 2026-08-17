import type {
  PlanConfig,
  PlanDraft,
  PlanValidationResult,
  StageDefinition,
  StageKind,
} from './types.js';

export const STAGE_CATALOG: StageDefinition[] = [
  {
    kind: 'records',
    label: 'Records',
    summary: 'Photos, scans, and the starting occlusion.',
    weeks: 1,
  },
  {
    kind: 'ipr',
    label: 'IPR',
    summary: 'Interproximal reduction where the setup needs space.',
    weeks: 1,
  },
  {
    kind: 'attachments',
    label: 'Attachments',
    summary: 'Composite buttons for predicted tooth movement.',
    weeks: 1,
  },
  {
    kind: 'aligners',
    label: 'Aligners',
    summary: 'Active aligner wear for the proposed sequence.',
    weeks: 8,
  },
  {
    kind: 'retainers',
    label: 'Retainers',
    summary: 'Hold the finish after the last aligner.',
    weeks: 2,
  },
];

const STAGE_BY_KIND: Record<StageKind, StageDefinition> = Object.fromEntries(
  STAGE_CATALOG.map((stage) => [stage.kind, stage]),
) as Record<StageKind, StageDefinition>;

export function stageDefinition(kind: StageKind): StageDefinition {
  return STAGE_BY_KIND[kind];
}

export function hasVisitEstimate(config: PlanConfig): boolean {
  return config.allowVisitEstimate;
}

export function estimateVisitWeeks(draft: PlanDraft): number {
  return draft.stages.reduce(
    (total, stage) => total + stageDefinition(stage.kind).weeks,
    0,
  );
}

export function isValidPlan(
  draft: PlanDraft,
  config: PlanConfig,
): PlanValidationResult {
  const errors: string[] = [];

  if (!draft.patientId.trim()) {
    errors.push('patientId is required');
  }

  if (draft.stages.length === 0) {
    errors.push('at least one stage is required');
  }

  if (draft.stages.length > config.maxStages) {
    errors.push(
      `at most ${config.maxStages} stage(s) allowed (got ${draft.stages.length})`,
    );
  }

  const seen = new Set<StageKind>();
  for (const stage of draft.stages) {
    if (seen.has(stage.kind)) {
      errors.push(`stage ${stage.kind} cannot be added twice`);
      break;
    }
    seen.add(stage.kind);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
