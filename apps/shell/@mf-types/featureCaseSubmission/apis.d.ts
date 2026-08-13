
    export type RemoteKeys = 'featureCaseSubmission/FeatureRoot';
    type PackageType<T> = T extends 'featureCaseSubmission/FeatureRoot' ? typeof import('featureCaseSubmission/FeatureRoot') :any;