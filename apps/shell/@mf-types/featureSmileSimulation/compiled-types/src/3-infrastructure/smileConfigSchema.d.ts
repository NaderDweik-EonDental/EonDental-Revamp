/** JSON Schema for smile-simulation feature config. Mirrored in manifest.json. */
export declare const smileConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly maxShadeOptions: {
            readonly type: "number";
        };
        readonly allowWhiteningPreview: {
            readonly type: "boolean";
        };
    };
    readonly required: readonly ["maxShadeOptions", "allowWhiteningPreview"];
    readonly additionalProperties: false;
};
