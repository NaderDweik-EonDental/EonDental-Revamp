export type FeatureId = 'case-submission' | 'smile-simulation' | '3d-viewer';

export interface TenantEntitlement {
  clientId: string;
  featureId: FeatureId;
  enabled: boolean;
  allowedVersionRange: { min?: string; max: string };
}

export interface UserEntitlement {
  userId: string;
  clientId: string | null;
  featureId: FeatureId;
  assignedVersion?: string;
}

export interface EffectiveEntitlement {
  featureId: FeatureId;
  enabled: boolean;
  version: string | null;
}
