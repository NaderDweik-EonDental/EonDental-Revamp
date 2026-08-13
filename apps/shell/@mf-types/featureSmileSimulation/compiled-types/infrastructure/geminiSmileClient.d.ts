/** Gemini Developer API client for chairside smile image simulation. */
export type GeminiSmileRequest = {
    photo: File;
    targetShade: string;
    includeWhitening: boolean;
    patientId: string;
};
export type GeminiSmileResult = {
    afterImageUrl: string;
    mimeType: string;
    model: string;
    note?: string;
};
export declare function isGeminiConfigured(): boolean;
export declare function generateSmileWithGemini(request: GeminiSmileRequest): Promise<GeminiSmileResult>;
//# sourceMappingURL=geminiSmileClient.d.ts.map