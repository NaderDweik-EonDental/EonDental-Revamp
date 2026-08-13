/** JSON Schema for smile-simulation feature config. Mirrored in manifest.json. */
export const smileConfigSchema = {
  type: 'object',
  properties: {
    maxShadeOptions: { type: 'number' },
    allowWhiteningPreview: { type: 'boolean' },
  },
  required: ['maxShadeOptions', 'allowWhiteningPreview'],
  additionalProperties: false,
} as const;
