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

const DOCTOR_STORAGE_KEY = 'eon-view-doctor-id';
const CLIENT_STORAGE_KEY = 'eon-view-client-id';
const DEFAULT_DOCTOR_ID = 'doc_123';
const DEFAULT_CLIENT_ID = 'eon-dental';

function readStored(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.sessionStorage.getItem(key)?.trim() || fallback;
}

function writeStored(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(key, value);
}

function sessionFor(
  view: ShellView,
  doctorId: string,
  clientId: string,
): AuthSession {
  if (view === 'doctor') {
    return {
      userId: doctorId,
      role: 'doctor',
      displayName: doctorId,
    };
  }
  if (view === 'client-admin') {
    return {
      userId: `admin_${clientId}`,
      role: 'client-admin',
      displayName: `${clientId} admin`,
    };
  }
  return {
    userId: 'super_1',
    role: 'super-admin',
    displayName: 'Super Admin',
  };
}

export interface ViewSwitcherContextValue {
  view: ShellView;
  session: AuthSession;
  /** Client the client-admin session manages. */
  managedClientId: string;
  selectedDoctorId: string;
  /** Increments when mock config changes so views and the switcher refetch. */
  configRevision: number;
  bumpConfigRevision: () => void;
  setView: (view: ShellView) => void;
  impersonateDoctor: (userId: string) => void;
  impersonateClientAdmin: (clientId: string) => void;
  impersonateSuperAdmin: () => void;
}

const ViewSwitcherContext = createContext<ViewSwitcherContextValue | null>(
  null,
);

export interface ViewSwitcherProviderProps {
  children: ReactNode;
  initialView?: ShellView;
}

function viewFromLocation(): ShellView {
  if (typeof window === 'undefined') {
    return 'doctor';
  }
  const path = window.location.pathname;
  if (path.includes('client-admin')) {
    return 'client-admin';
  }
  if (path.includes('super-admin')) {
    return 'super-admin';
  }
  return 'doctor';
}

export function ViewSwitcherProvider({
  children,
  initialView,
}: ViewSwitcherProviderProps) {
  const [view, setViewState] = useState<ShellView>(
    initialView ?? viewFromLocation(),
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState(() =>
    readStored(DOCTOR_STORAGE_KEY, DEFAULT_DOCTOR_ID),
  );
  const [managedClientId, setManagedClientId] = useState(() =>
    readStored(CLIENT_STORAGE_KEY, DEFAULT_CLIENT_ID),
  );
  const [configRevision, setConfigRevision] = useState(0);

  const setView = useCallback((next: ShellView) => {
    setViewState(next);
  }, []);

  const bumpConfigRevision = useCallback(() => {
    setConfigRevision((current) => current + 1);
  }, []);

  const impersonateDoctor = useCallback((userId: string) => {
    writeStored(DOCTOR_STORAGE_KEY, userId);
    setSelectedDoctorId(userId);
    setViewState('doctor');
  }, []);

  const impersonateClientAdmin = useCallback((clientId: string) => {
    writeStored(CLIENT_STORAGE_KEY, clientId);
    setManagedClientId(clientId);
    setViewState('client-admin');
  }, []);

  const impersonateSuperAdmin = useCallback(() => {
    setViewState('super-admin');
  }, []);

  const value = useMemo<ViewSwitcherContextValue>(
    () => ({
      view,
      session: sessionFor(view, selectedDoctorId, managedClientId),
      managedClientId,
      selectedDoctorId,
      configRevision,
      bumpConfigRevision,
      setView,
      impersonateDoctor,
      impersonateClientAdmin,
      impersonateSuperAdmin,
    }),
    [
      bumpConfigRevision,
      configRevision,
      impersonateClientAdmin,
      impersonateDoctor,
      impersonateSuperAdmin,
      managedClientId,
      selectedDoctorId,
      setView,
      view,
    ],
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
