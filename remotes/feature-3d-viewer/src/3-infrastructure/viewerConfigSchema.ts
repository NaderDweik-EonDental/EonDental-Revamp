/** JSON Schema for 3d-viewer feature config. Mirrored in manifest.json. */
export const viewerConfigSchema = {
  type: 'object',
  properties: {
    allowedFormats: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    defaultCamera: {
      type: 'string',
      enum: ['front', 'occlusal', 'lateral'],
    },
  },
  required: ['allowedFormats', 'defaultCamera'],
  additionalProperties: false,
} as const;
