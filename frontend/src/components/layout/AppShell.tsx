import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AiChatWidget } from '@/features/ai/AiChatWidget';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'My Dashboard',
  '/tickets': 'Tickets',
  '/time-logs': 'My Time Logs',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/types': 'Types',
  '/admin/labels': 'Labels',
  '/admin/partners': 'Partners',
};

export function AppShell() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Ticket System';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AiChatWidget />
    </div>
  );
}
