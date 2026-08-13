/** JSON Schema for case-submission feature config. Mirrored in manifest.json. */
export declare const caseConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly requireXray: {
            readonly type: "boolean";
        };
        readonly maxAttachments: {
            readonly type: "number";
        };
        readonly packages: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly code: {
                        readonly type: "string";
                    };
                    readonly label: {
                        readonly type: "string";
                    };
                    readonly accent: {
                        readonly type: "string";
                        readonly enum: readonly ["slate", "graphite", "navy", "coral", "emerald", "teal", "mint", "plum"];
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly maxAlignerSteps: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly const: "unlimited";
                        }];
                    };
                    readonly durationMonths: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly const: "unlimited";
                        }];
                    };
                    readonly refinements: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly const: "unlimited";
                        }];
                    };
                    readonly tsRevisions: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly const: "unlimited";
                        }];
                    };
                    readonly retainerSets: {
                        readonly oneOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly const: "unlimited";
                        }];
                    };
                };
                readonly required: readonly ["id", "code", "label", "accent", "description", "maxAlignerSteps", "durationMonths", "refinements", "tsRevisions", "retainerSets"];
                readonly additionalProperties: false;
            };
        };
    };
    readonly required: readonly ["requireXray", "maxAttachments"];
    readonly additionalProperties: false;
};
//# sourceMappingURL=caseConfigSchema.d.ts.map