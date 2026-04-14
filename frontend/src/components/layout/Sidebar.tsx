import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Ticket, Clock, Users, Tag,
  ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { Avatar } from '@/components/ui/Avatar';
import { authApi } from '@/api/auth';

const navItems = [
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/time-logs', label: 'My Time', icon: Clock },
];

const adminItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={clsx(
        'flex flex-col bg-gray-900 text-white transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700">
        {sidebarOpen && (
          <span className="font-bold text-lg text-white truncate">TicketSystem</span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            {sidebarOpen && (
              <p className="text-xs text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">Admin</p>
            )}
            {adminItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-700 p-3">
        <div className={clsx('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <Avatar src={user?.avatar_url} name={user?.name ?? ''} size="sm" />
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
