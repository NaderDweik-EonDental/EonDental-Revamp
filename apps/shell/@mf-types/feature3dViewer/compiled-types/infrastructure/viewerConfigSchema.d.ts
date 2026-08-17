/** JSON Schema for 3d-viewer feature config. Mirrored in manifest.json. */
export declare const viewerConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly allowedFormats: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly minItems: 1;
        };
        readonly defaultCamera: {
            readonly type: "string";
            readonly enum: readonly ["front", "occlusal", "lateral"];
        };
    };
    readonly required: readonly ["allowedFormats", "defaultCamera"];
    readonly additionalProperties: false;
};
//# sourceMappingURL=viewerConfigSchema.d.ts.map