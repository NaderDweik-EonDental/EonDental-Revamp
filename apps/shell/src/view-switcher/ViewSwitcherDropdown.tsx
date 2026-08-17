import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClientRecord, DoctorRecord } from '@eon/core-config-client';
import { useAuth } from '../app-shell/AuthProvider.js';
import { useViewSwitcher } from './ViewSwitcherContext.js';
import './viewSwitcher.css';

type SwitcherValue =
  | 'super-admin'
  | `doctor:${string}`
  | `client:${string}`;

/**
 * Dev-only convenience — not a production "view as" feature.
 * Lists mock doctors and clients from the config API so new personas appear here.
 * See ARCHITECTURE.md §9.
 */
export function ViewSwitcherDropdown() {
  if (import.meta.env.VITE_ENABLE_VIEW_SWITCHER === 'false') {
    return null;
  }

  return <ViewSwitcherDropdownInner />;
}

function ViewSwitcherDropdownInner() {
  const {
    view,
    selectedDoctorId,
    managedClientId,
    configRevision,
    impersonateDoctor,
    impersonateClientAdmin,
    impersonateSuperAdmin,
  } = useViewSwitcher();
  const { configClient } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextDoctors, nextClients] = await Promise.all([
          configClient.listDoctors(),
          configClient.listClients(),
        ]);
        if (!cancelled) {
          setDoctors(nextDoctors);
          setClients(nextClients);
        }
      } catch {
        if (!cancelled) {
          setDoctors([]);
          setClients([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configClient, configRevision]);

  const selected: SwitcherValue =
    view === 'super-admin'
      ? 'super-admin'
      : view === 'doctor'
        ? `doctor:${selectedDoctorId}`
        : `client:${managedClientId}`;

  return (
    <label className="view-switcher">
      <span className="view-switcher__label">View as</span>
      <select
        value={selected}
        onChange={(event) => {
          const next = event.target.value as SwitcherValue;
          if (next === 'super-admin') {
            impersonateSuperAdmin();
            void navigate('/super-admin');
            return;
          }
          if (next.startsWith('doctor:')) {
            impersonateDoctor(next.slice('doctor:'.length));
            void navigate('/doctor');
            return;
          }
          if (next.startsWith('client:')) {
            impersonateClientAdmin(next.slice('client:'.length));
            void navigate('/client-admin');
          }
        }}
      >
        <optgroup label="Doctors">
          {doctors.length === 0 ? (
            <option value={`doctor:${selectedDoctorId}`} disabled>
              No doctors yet
            </option>
          ) : (
            doctors.map((doctor) => (
              <option key={doctor.userId} value={`doctor:${doctor.userId}`}>
                {doctor.userId} · {doctor.clientId}
              </option>
            ))
          )}
        </optgroup>
        <optgroup label="Client admins">
          {clients.length === 0 ? (
            <option value={`client:${managedClientId}`} disabled>
              No clients yet
            </option>
          ) : (
            clients.map((client) => (
              <option
                key={client.clientId}
                value={`client:${client.clientId}`}
              >
                {client.clientId}
              </option>
            ))
          )}
        </optgroup>
        <optgroup label="Platform">
          <option value="super-admin">Super admin</option>
        </optgroup>
      </select>
    </label>
  );
}
