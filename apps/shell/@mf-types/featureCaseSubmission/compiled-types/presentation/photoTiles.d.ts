import type { AttachmentType } from '../domain/caseRules.js';
export interface PhotoTileDef {
    key: string;
    label: string;
    type: AttachmentType;
    fileName: string;
    required?: boolean;
    recommended?: boolean;
    beta?: boolean;
}
export interface PhotoSectionDef {
    title: string;
    tiles: PhotoTileDef[];
}
export declare const PHOTO_SECTIONS: PhotoSectionDef[];
//# sourceMappingURL=photoTiles.d.ts.map