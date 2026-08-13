/** Local mouth-region enhancement so before/after always shows a clear delta. */
export type EnhanceOptions = {
    targetShadeHex: string;
    includeWhitening: boolean;
    /** 0–1 how strongly to pull teeth toward midline (gap-closing illusion). */
    alignStrength?: number;
};
export declare function enhanceSmilePhoto(source: CanvasImageSource, width: number, height: number, options: EnhanceOptions): Promise<string>;
export declare function loadImageElement(src: string): Promise<HTMLImageElement>;
//# sourceMappingURL=enhanceSmilePhoto.d.ts.map