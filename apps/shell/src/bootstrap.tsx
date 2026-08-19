import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './app-shell/AuthProvider.js';
import { router } from './app-shell/router.js';
import { ViewSwitcherProvider } from './view-switcher/ViewSwitcherContext.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <ViewSwitcherProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ViewSwitcherProvider>
  </StrictMode>,
);
