import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ticket, CheckCircle, AlertCircle, TrendingUp, AlertTriangle, Filter } from 'lucide-react';
import { userDashboardApi } from '@/api/userDashboard';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatDate, formatRelative, STATUS_LABELS } from '@/utils/formatters';

const STATUS_ORDER = ['open', 'in_progress', 'in_review', 'resolved', 'closed'];
const STATUS_BAR_COLORS: Record<string, string> = {
  open:        '#3b82f6',
  in_progress: '#f59e0b',
  in_review:   '#8b5cf6',
  resolved:    '#10b981',
  closed:      '#6b7280',
};

export function UserDashboardPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'my-summary'],
    queryFn: userDashboardApi.summary,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-gray-400">Loading dashboard...</div>;
  }

  if (!data) return null;

  const { stats, tickets } = data;
  const totalForBar = Object.values(stats.by_status).reduce((s, v) => s + v, 0);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  const hasActiveFilter = Boolean(statusFilter || priorityFilter);

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="flex items-center gap-4">
        <Avatar src={user?.avatar_url} name={user?.name ?? ''} size="lg" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here's an overview of your assigned tickets.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned',   value: stats.total_assigned, icon: Ticket,        color: 'bg-indigo-500' },
          { label: 'Open',       value: stats.open,           icon: AlertCircle,   color: 'bg-blue-500' },
          { label: 'Resolved',   value: stats.resolved,       icon: CheckCircle,   color: 'bg-green-500' },
          { label: 'Overdue',    value: stats.overdue,        icon: AlertTriangle, color: stats.overdue > 0 ? 'bg-red-500' : 'bg-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`${color} text-white p-2.5 rounded-lg`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress + By Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Circular Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-900">My Progress</h3>
          </div>
          <div className="flex items-center justify-center mb-3">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#6366f1" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.progress_pct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{stats.progress_pct}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            {stats.resolved} of {stats.total_assigned} tickets resolved
          </p>
        </div>

        {/* Breakdown by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Status</h3>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = stats.by_status[status] ?? 0;
              const pct = totalForBar > 0 ? Math.round((count / totalForBar) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{STATUS_LABELS[status]}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: STATUS_BAR_COLORS[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assigned Tickets Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900">
            My Assigned Tickets
            <span className="ml-2 text-sm text-gray-400 font-normal">
              {hasActiveFilter ? `${filteredTickets.length} of ${tickets.length}` : tickets.length}
            </span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {hasActiveFilter && (
              <button
                onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 border border-gray-300 rounded-lg hover:border-red-300"
              >
                Clear
              </button>
            )}
            <Link
              to="/tickets"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium ml-2"
            >
              View all →
            </Link>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Ticket size={36} className="mx-auto mb-3 opacity-40" />
            <p>No tickets assigned to you yet.</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Ticket size={36} className="mx-auto mb-3 opacity-40" />
            <p>No tickets match the selected filters.</p>
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className="text-sm text-indigo-600 hover:underline mt-2 block mx-auto"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/tickets/${ticket.ulid}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors block max-w-xs truncate"
                    >
                      {ticket.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">{ticket.ulid.slice(-8)}</span>
                      {ticket.category && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: ticket.category.color + '20', color: ticket.category.color }}
                        >
                          {ticket.category.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status as string} /></td>
                  <td className="px-6 py-4"><PriorityBadge priority={ticket.priority as string} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={ticket.reporter?.avatar_url} name={ticket.reporter?.name ?? '?'} size="sm" />
                      <span className="text-gray-600 text-sm">{ticket.reporter?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.due_date ? (
                      <span className={
                        new Date(ticket.due_date) < new Date() &&
                        !['resolved', 'closed'].includes(ticket.status as string)
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }>
                        {formatDate(ticket.due_date)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatRelative(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
