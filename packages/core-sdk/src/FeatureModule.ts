import type { ComponentType } from 'react';
import type { EffectiveEntitlement } from '@eon/core-entitlements';

export interface FeatureProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  entitlement: EffectiveEntitlement;
}

export type FeatureComponent<TConfig = Record<string, unknown>> = ComponentType<
  FeatureProps<TConfig>
>;
