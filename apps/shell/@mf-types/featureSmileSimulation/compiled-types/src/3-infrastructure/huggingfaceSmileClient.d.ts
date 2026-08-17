export type HuggingFaceSmileRequest = {
    photo: File;
    targetShade: string;
    includeWhitening: boolean;
    patientId: string;
};
export type HuggingFaceSmileResult = {
    afterImageUrl: string;
    mimeType: string;
    model: string;
};
export declare function isHuggingFaceConfigured(): boolean;
export declare function generateSmileWithHuggingFace(request: HuggingFaceSmileRequest): Promise<HuggingFaceSmileResult>;
