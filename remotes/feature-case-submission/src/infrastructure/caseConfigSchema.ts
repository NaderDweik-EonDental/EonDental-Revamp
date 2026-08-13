/** JSON Schema for case-submission feature config. Mirrored in manifest.json. */

const casePackageSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    label: { type: 'string' },
    accent: {
      type: 'string',
      enum: ['slate', 'graphite', 'navy', 'coral', 'emerald', 'teal', 'mint', 'plum'],
    },
    description: { type: 'string' },
    maxAlignerSteps: {
      oneOf: [{ type: 'number' }, { const: 'unlimited' }],
    },
    durationMonths: {
      oneOf: [{ type: 'number' }, { const: 'unlimited' }],
    },
    refinements: {
      oneOf: [{ type: 'number' }, { const: 'unlimited' }],
    },
    tsRevisions: {
      oneOf: [{ type: 'number' }, { const: 'unlimited' }],
    },
    retainerSets: {
      oneOf: [{ type: 'number' }, { const: 'unlimited' }],
    },
  },
  required: [
    'id',
    'code',
    'label',
    'accent',
    'description',
    'maxAlignerSteps',
    'durationMonths',
    'refinements',
    'tsRevisions',
    'retainerSets',
  ],
  additionalProperties: false,
} as const;

export const caseConfigSchema = {
  type: 'object',
  properties: {
    requireXray: { type: 'boolean' },
    maxAttachments: { type: 'number' },
    packages: { type: 'array', items: casePackageSchema },
  },
  required: ['requireXray', 'maxAttachments'],
  additionalProperties: false,
} as const;
