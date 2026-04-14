import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute, AdminRoute } from '@/features/auth/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoginPage } from '@/features/auth/LoginPage';
import { TicketListPage } from '@/features/tickets/TicketListPage';
import { TicketDetailPage } from '@/features/tickets/TicketDetailPage';
import { TicketForm } from '@/features/tickets/TicketForm';
import { AdminDashboardPage } from '@/features/dashboard/AdminDashboardPage';
import { TimeLogPage } from '@/features/timeLogs/TimeLogPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminCategoriesPage } from '@/features/admin/AdminCategoriesPage';
import { AdminUserProfilePage } from '@/features/admin/AdminUserProfilePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/tickets" replace /> },
          { path: '/tickets', element: <TicketListPage /> },
          { path: '/tickets/new', element: <TicketForm /> },
          { path: '/tickets/:ulid', element: <TicketDetailPage /> },
          { path: '/tickets/:ulid/edit', element: <TicketForm /> },
          { path: '/time-logs', element: <TimeLogPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/users/:id', element: <AdminUserProfilePage /> },
              { path: '/admin/categories', element: <AdminCategoriesPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
