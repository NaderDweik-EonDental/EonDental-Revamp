
    export type RemoteKeys = 'feature3dViewer/FeatureRoot';
    type PackageType<T> = T extends 'feature3dViewer/FeatureRoot' ? typeof import('feature3dViewer/FeatureRoot') :any;