/** JSON Schema for treatment-plan feature config. Mirrored in manifest.json. */
export const planConfigSchema = {
  type: 'object',
  properties: {
    maxStages: { type: 'number' },
    allowVisitEstimate: { type: 'boolean' },
  },
  required: ['maxStages', 'allowVisitEstimate'],
  additionalProperties: false,
} as const;
