export type FeatureId =
  | 'case-submission'
  | 'smile-simulation'
  | '3d-viewer'
  | 'treatment-plan';

export interface TenantEntitlement {
  clientId: string;
  featureId: FeatureId;
  enabled: boolean;
  /** Exact versions super-admin grants this client. Not a max range. */
  allowedVersions: string[];
}

export interface UserEntitlement {
  userId: string;
  clientId: string;
  featureId: FeatureId;
  assignedVersion?: string;
}

export interface EffectiveEntitlement {
  featureId: FeatureId;
  enabled: boolean;
  version: string | null;
}
