import { useNavigate } from 'react-router-dom';
import { useViewSwitcher, type ShellView } from './ViewSwitcherContext.js';
import './viewSwitcher.css';

const VIEWS: { id: ShellView; label: string; path: string }[] = [
  { id: 'doctor', label: 'Doctor', path: '/doctor' },
  { id: 'client-admin', label: 'Client admin', path: '/client-admin' },
  { id: 'super-admin', label: 'Super admin', path: '/super-admin' },
];

/**
 * Dev-only convenience — not a production "view as" feature.
 * See ARCHITECTURE.md §9.
 */
export function ViewSwitcherDropdown() {
  if (import.meta.env.VITE_ENABLE_VIEW_SWITCHER !== 'true') {
    return null;
  }

  return <ViewSwitcherDropdownInner />;
}

function ViewSwitcherDropdownInner() {
  const { view, setView } = useViewSwitcher();
  const navigate = useNavigate();

  return (
    <label className="view-switcher">
      <span className="view-switcher__label">View</span>
      <select
        value={view}
        onChange={(event) => {
          const next = event.target.value as ShellView;
          const target = VIEWS.find((v) => v.id === next);
          setView(next);
          if (target) {
            void navigate(target.path);
          }
        }}
      >
        {VIEWS.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}
