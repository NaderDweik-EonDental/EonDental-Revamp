import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout.js';

const DoctorHome = lazy(() =>
  import('../views/doctor/pages/DoctorHome.js').then((m) => ({
    default: m.DoctorHome,
  })),
);

const ClientAdminHome = lazy(() =>
  import('../views/client-admin/pages/ClientAdminHome.js').then((m) => ({
    default: m.ClientAdminHome,
  })),
);

const SuperAdminHome = lazy(() =>
  import('../views/super-admin/pages/SuperAdminHome.js').then((m) => ({
    default: m.SuperAdminHome,
  })),
);

function LazyView({
  fallback,
  children,
}: {
  fallback: string;
  children: ReactNode;
}) {
  return <Suspense fallback={<p>{fallback}</p>}>{children}</Suspense>;
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/doctor" replace /> },
        {
          path: 'doctor',
          element: (
            <LazyView fallback="Loading doctor view…">
              <DoctorHome />
            </LazyView>
          ),
        },
        {
          path: 'client-admin',
          element: (
            <LazyView fallback="Loading client admin…">
              <ClientAdminHome />
            </LazyView>
          ),
        },
        {
          path: 'super-admin',
          element: (
            <LazyView fallback="Loading super admin…">
              <SuperAdminHome />
            </LazyView>
          ),
        },
      ],
    },
  ],
  {
    basename:
      import.meta.env.BASE_URL.replace(/\/$/, '') || undefined,
  },
);
