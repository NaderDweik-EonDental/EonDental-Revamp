/** JSON Schema for treatment-plan feature config. Mirrored in manifest.json. */
export declare const planConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly maxStages: {
            readonly type: "number";
        };
        readonly allowVisitEstimate: {
            readonly type: "boolean";
        };
    };
    readonly required: readonly ["maxStages", "allowVisitEstimate"];
    readonly additionalProperties: false;
};
