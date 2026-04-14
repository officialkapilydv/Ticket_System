import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Shield, Clock, Ticket,
  CheckCircle, AlertCircle, TrendingUp, Calendar,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatRelative, STATUS_LABELS, PRIORITY_LABELS } from '@/utils/formatters';
import type { Ticket as TicketType } from '@/types';

const STATUS_ORDER = ['open', 'in_progress', 'in_review', 'resolved', 'closed'];
const STATUS_COLORS_BAR: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  in_review: '#8b5cf6',
  resolved: '#10b981',
  closed: '#6b7280',
};

const PRIORITY_COLORS_BAR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#10b981',
};

export function AdminUserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user-profile', id],
    queryFn: () => adminApi.userProfile(Number(id)),
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.toggleUserActive(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'user-profile', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (!data) return null;

  const { user, stats, tickets } = data;

  const totalTicketsForBar = Object.values(stats.by_status as Record<string, number>).reduce(
    (s: number, v) => s + (v as number), 0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <Avatar src={user.avatar_url} name={user.name} size="lg" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail size={14} /> {user.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Shield size={14} />
                  <Badge className={
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </span>
                <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <Calendar size={12} className="inline mr-1" />
                Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={user.is_active ? 'danger' : 'secondary'}
              size="sm"
              loading={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate()}
            >
              {user.is_active ? 'Deactivate Account' : 'Activate Account'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Assigned Tickets',
            value: stats.total_assigned,
            icon: Ticket,
            color: 'bg-indigo-500',
          },
          {
            label: 'Resolved',
            value: stats.resolved,
            icon: CheckCircle,
            color: 'bg-green-500',
          },
          {
            label: 'Overdue',
            value: stats.overdue,
            icon: AlertCircle,
            color: stats.overdue > 0 ? 'bg-red-500' : 'bg-gray-400',
          },
          {
            label: 'Hours This Month',
            value: `${stats.month_hours}h`,
            icon: Clock,
            color: 'bg-blue-500',
          },
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

      {/* Progress + Breakdown */}
      <div className="grid grid-cols-3 gap-6">

        {/* Overall Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Overall Progress</h3>
          </div>
          <div className="flex items-center justify-center mb-4">
            {/* Circular progress */}
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
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Total time logged: <span className="font-semibold text-gray-700">{stats.total_hours}h</span>
            </p>
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Status</h3>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = (stats.by_status as Record<string, number>)[status] ?? 0;
              const pct = totalTicketsForBar > 0 ? Math.round((count / totalTicketsForBar) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{STATUS_LABELS[status]}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS_BAR[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map((priority) => {
              const count = (stats.by_priority as Record<string, number>)[priority] ?? 0;
              const pct = totalTicketsForBar > 0 ? Math.round((count / totalTicketsForBar) * 100) : 0;
              return (
                <div key={priority}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{PRIORITY_LABELS[priority]}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS_BAR[priority] }}
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Assigned Tickets
            <span className="ml-2 text-sm text-gray-400 font-normal">({tickets.length})</span>
          </h3>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Ticket size={36} className="mx-auto mb-3 opacity-40" />
            <p>No tickets assigned to this user yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(tickets as TicketType[]).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/tickets/${ticket.ulid}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors block max-w-xs truncate"
                    >
                      {ticket.title}
                    </Link>
                    <span className="text-xs text-gray-400 font-mono">{ticket.ulid.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status as string} /></td>
                  <td className="px-6 py-4"><PriorityBadge priority={ticket.priority as string} /></td>
                  <td className="px-6 py-4">
                    {ticket.category ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: ticket.category.color + '20',
                          color: ticket.category.color,
                        }}
                      >
                        {ticket.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
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
