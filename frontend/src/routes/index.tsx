import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute, AdminRoute } from '@/features/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

function HomeRedirect() {
  const { isAdmin } = useAuthStore();
  return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
}
import { RouteErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoginPage } from '@/features/auth/LoginPage';
import { TicketListPage } from '@/features/tickets/TicketListPage';
import { TicketDetailPage } from '@/features/tickets/TicketDetailPage';
import { TicketForm } from '@/features/tickets/TicketForm';
import { TaskListPage } from '@/features/tasks/TaskListPage';
import { TaskDetailPage } from '@/features/tasks/TaskDetailPage';
import { TaskForm } from '@/features/tasks/TaskForm';
import { AdminDashboardPage } from '@/features/dashboard/AdminDashboardPage';
import { UserDashboardPage } from '@/features/dashboard/UserDashboardPage';
import { TimeLogPage } from '@/features/timeLogs/TimeLogPage';
import { TimeReportPage } from '@/features/timeLogs/TimeReportPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminCategoriesPage } from '@/features/admin/AdminCategoriesPage';
import { AdminLabelsPage } from '@/features/admin/AdminLabelsPage';
import { AdminPartnersPage } from '@/features/admin/AdminPartnersPage';
import { AdminUserProfilePage } from '@/features/admin/AdminUserProfilePage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ProjectReportPage } from '@/features/reports/ProjectReportPage';
import { TaskReportPage } from '@/features/reports/TaskReportPage';
import { TicketReportPage } from '@/features/reports/TicketReportPage';

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
          { index: true, element: <HomeRedirect /> },
          { path: '/dashboard', element: <UserDashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/tasks', element: <TaskListPage /> },
          { path: '/tasks/new', element: <TaskForm /> },
          { path: '/tasks/:ulid', element: <TaskDetailPage /> },
          { path: '/tasks/:ulid/edit', element: <TaskForm /> },
          { path: '/tickets', element: <TicketListPage /> },
          { path: '/tickets/new', element: <TicketForm /> },
          { path: '/tickets/:ulid', element: <TicketDetailPage /> },
          { path: '/tickets/:ulid/edit', element: <TicketForm /> },
          { path: '/time-logs', element: <TimeLogPage /> },
          { path: '/time-report', element: <TimeReportPage /> },
          { path: '/reports/projects', element: <ProjectReportPage /> },
          { path: '/reports/tasks', element: <TaskReportPage /> },
          { path: '/reports/tickets', element: <TicketReportPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/users/:id', element: <AdminUserProfilePage /> },
              { path: '/admin/types', element: <AdminCategoriesPage /> },
              { path: '/admin/labels', element: <AdminLabelsPage /> },
              { path: '/admin/partners', element: <AdminPartnersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
