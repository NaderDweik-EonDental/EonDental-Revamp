import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './app-shell/AuthProvider.js';
import { router } from './app-shell/router.js';
import { ViewSwitcherProvider } from './view-switcher/ViewSwitcherContext.js';

async function prepare(): Promise<void> {
  const enableMsw =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true';
  if (enableMsw) {
    const { worker } = await import('./mocks/browser.js');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element');
}

void prepare().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <ViewSwitcherProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ViewSwitcherProvider>
    </StrictMode>,
  );
});
