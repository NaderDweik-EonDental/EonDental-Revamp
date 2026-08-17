
    export type RemoteKeys = 'featureTreatmentPlan/FeatureRoot';
    type PackageType<T> = T extends 'featureTreatmentPlan/FeatureRoot' ? typeof import('featureTreatmentPlan/FeatureRoot') :any;