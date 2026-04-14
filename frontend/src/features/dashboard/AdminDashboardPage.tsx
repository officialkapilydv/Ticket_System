import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminApi } from '@/api/admin';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import { Ticket, Users, AlertCircle, Clock } from 'lucide-react';

const STATUS_CHART_COLORS: Record<string, string> = {
  open: '#3b82f6', in_progress: '#f59e0b', in_review: '#8b5cf6',
  resolved: '#10b981', closed: '#6b7280',
};

const PRIORITY_CHART_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#3b82f6', high: '#f97316', critical: '#ef4444',
};

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboardSummary,
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;
  if (!data) return null;

  const statusChartData = Object.entries(data.by_status).map(([name, value]) => ({ name, value }));
  const priorityChartData = Object.entries(data.by_priority).map(([name, value]) => ({ name, value }));
  const weeklyData = data.weekly_created.map((d) => ({
    date: d.date.slice(5),
    tickets: d.count,
  }));

  const statCards = [
    { label: 'Total Tickets', value: data.totals.tickets, icon: Ticket, color: 'bg-indigo-500' },
    { label: 'Open Tickets', value: data.totals.open, icon: AlertCircle, color: 'bg-blue-500' },
    { label: 'Overdue', value: data.totals.overdue, icon: Clock, color: 'bg-red-500' },
    { label: 'Active Users', value: data.totals.users, icon: Users, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`${color} text-white p-2.5 rounded-lg`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Weekly trend */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets Created (Last 7 Days)</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No ticket data for the last 7 days
            </div>
          )}
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name] ?? '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority bar + Recent tickets */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Priority</h3>
          <div className="space-y-3">
            {priorityChartData.map(({ name, value }) => {
              const total = priorityChartData.reduce((s, d) => s + d.value, 0);
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-600">{name}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: PRIORITY_CHART_COLORS[name] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {data.recent_tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link to={`/tickets/${ticket.ulid}`} className="font-medium text-gray-900 hover:text-indigo-600 truncate block max-w-xs">
                      {ticket.title}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(ticket.created_at)}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={ticket.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
