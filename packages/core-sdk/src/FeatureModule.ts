import type { ComponentType } from 'react';
import type { EffectiveEntitlement } from '@eon/core-entitlements';


// federation prop contract
export interface FeatureProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  entitlement: EffectiveEntitlement;
}

// react component that takes a config and an entitlement and renders the feature
export type FeatureComponent<TConfig = Record<string, unknown>> = ComponentType<
  FeatureProps<TConfig>
>;
