import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthRole, AuthSession } from '../app-shell/authTypes.js';

export type ShellView = AuthRole;

const VIEW_SESSIONS: Record<ShellView, AuthSession> = {
  doctor: {
    userId: 'doc_123',
    role: 'doctor',
    displayName: 'Dr. Mock',
  },
  'client-admin': {
    userId: 'admin_eon',
    role: 'client-admin',
    displayName: 'EON Client Admin',
  },
  'super-admin': {
    userId: 'super_1',
    role: 'super-admin',
    displayName: 'Super Admin',
  },
};

export interface ViewSwitcherContextValue {
  view: ShellView;
  session: AuthSession;
  /** Client the client-admin session manages (mock). */
  managedClientId: string;
  /** Increments when super-admin persists entitlements so other views refetch. */
  configRevision: number;
  bumpConfigRevision: () => void;
  setView: (view: ShellView) => void;
}

const ViewSwitcherContext = createContext<ViewSwitcherContextValue | null>(
  null,
);

export interface ViewSwitcherProviderProps {
  children: ReactNode;
  initialView?: ShellView;
}

export function ViewSwitcherProvider({
  children,
  initialView = 'doctor',
}: ViewSwitcherProviderProps) {
  const [view, setViewState] = useState<ShellView>(initialView);
  const [configRevision, setConfigRevision] = useState(0);

  const setView = useCallback((next: ShellView) => {
    setViewState(next);
  }, []);

  const bumpConfigRevision = useCallback(() => {
    setConfigRevision((current) => current + 1);
  }, []);

  const value = useMemo<ViewSwitcherContextValue>(
    () => ({
      view,
      session: VIEW_SESSIONS[view],
      managedClientId: 'eon-dental',
      configRevision,
      bumpConfigRevision,
      setView,
    }),
    [bumpConfigRevision, configRevision, setView, view],
  );

  return (
    <ViewSwitcherContext.Provider value={value}>
      {children}
    </ViewSwitcherContext.Provider>
  );
}

export function useViewSwitcher(): ViewSwitcherContextValue {
  const ctx = useContext(ViewSwitcherContext);
  if (!ctx) {
    throw new Error('useViewSwitcher must be used within ViewSwitcherProvider');
  }
  return ctx;
}
