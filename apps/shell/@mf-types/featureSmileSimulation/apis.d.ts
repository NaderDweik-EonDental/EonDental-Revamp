
    export type RemoteKeys = 'featureSmileSimulation/FeatureRoot';
    type PackageType<T> = T extends 'featureSmileSimulation/FeatureRoot' ? typeof import('featureSmileSimulation/FeatureRoot') :any;