import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  MockConfigClient,
  type ConfigClient,
} from '@eon/core-config-client';
import { useViewSwitcher } from '../view-switcher/ViewSwitcherContext.js';
import type { AuthSession } from './authTypes.js';

export type { AuthRole, AuthSession } from './authTypes.js';

export interface AuthContextValue {
  session: AuthSession;
  configClient: ConfigClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  configClient?: ConfigClient;
}

/**
 * Session comes from the (dev) view switcher so admin ↔ doctor flips
 * update AuthProvider without a real login system yet.
 */
export function AuthProvider({
  children,
  configClient = new MockConfigClient(),
}: AuthProviderProps) {
  const { session } = useViewSwitcher();

  const value = useMemo<AuthContextValue>(
    () => ({ session, configClient }),
    [configClient, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
