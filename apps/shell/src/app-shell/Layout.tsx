import { Link, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';
import { ViewSwitcherDropdown } from '../view-switcher/ViewSwitcherDropdown.js';
import './layout.css';

export function Layout() {
  const { session } = useAuth();

  return (
    <div className="shell-layout">
      <header className="shell-layout__header">
        <Link to="/" className="shell-layout__brand">
          EON
        </Link>
        <div className="shell-layout__actions">
          <ViewSwitcherDropdown />
          <p className="shell-layout__session">
            {session.displayName} · {session.role}
          </p>
        </div>
      </header>
      <main className="shell-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
