import { type ViewerConfig, type ViewerLoadRequest } from '../domain/viewerRules.js';
export interface LoadedModel {
    modelId: string;
    modelName: string;
    upperModelName: string;
    lowerModelName: string;
    triangles: number;
}
export interface ViewerApi {
    load(request: ViewerLoadRequest): Promise<LoadedModel>;
}
export type LoadModelResult = {
    ok: true;
    model: LoadedModel;
} | {
    ok: false;
    errors: string[];
};
export declare function loadModel(request: ViewerLoadRequest, config: ViewerConfig, api: ViewerApi): Promise<LoadModelResult>;
//# sourceMappingURL=loadModel.d.ts.map