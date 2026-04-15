import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { projectsApi } from '@/api/projects';
import { partnersApi } from '@/api/partners';
import { adminApi } from '@/api/admin';

const STATUSES   = ['open', 'in_progress', 'in_review', 'resolved', 'closed'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export function TicketReportPage() {
  const [projectId, setProjectId]   = useState('');
  const [partnerId, setPartnerId]   = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus]         = useState('');
  const [priority, setPriority]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['report-tickets', { projectId, partnerId, assigneeId, status, priority }],
    queryFn: () => reportsApi.tickets({
      project_id:  projectId  ? Number(projectId)  : undefined,
      partner_id:  partnerId  ? Number(partnerId)  : undefined,
      assignee_id: assigneeId ? Number(assigneeId) : undefined,
      status:   status   || undefined,
      priority: priority || undefined,
    }),
  });

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
  const { data: partners } = useQuery({ queryKey: ['partners'], queryFn: partnersApi.list });
  const { data: users }    = useQuery({ queryKey: ['users-list'], queryFn: () => adminApi.listUsers() });

  const summary    = data?.summary    ?? { total: 0, open: 0, resolved: 0, closed: 0, overdue: 0 };
  const byStatus   = data?.by_status   ?? [];
  const byPriority = data?.by_priority ?? [];
  const byProject  = data?.by_project  ?? [];
  const byAssignee = data?.by_assignee ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tickets Report</h2>
        <p className="text-sm text-gray-500 mt-1">Breakdown of customer-facing tickets by status, priority, project and assignee</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select value={projectId} onChange={e => setProjectId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
            <option value="">All Projects</option>
            {projects?.map((p: { id: number; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
            <option value="">All Partners</option>
            {partners?.map((p: { id: number; name: string; company?: string }) => (
              <option key={p.id} value={p.id}>{p.company ? `${p.name} (${p.company})` : p.name}</option>
            ))}
          </select>
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
            <option value="">All Assignees</option>
            {users?.data?.map((u: { id: number; name: string }) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard label="Total Tickets" value={summary.total}    />
            <StatCard label="Open"          value={summary.open}     color="text-blue-600" />
            <StatCard label="Resolved"      value={summary.resolved} color="text-green-600" />
            <StatCard label="Closed"        value={summary.closed}   color="text-gray-500" />
            <StatCard label="Overdue"       value={summary.overdue}  color="text-red-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Status */}
            <BreakdownTable
              title="By Status"
              rows={byStatus.map((r: { status: string; count: number }) => ({
                label: r.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                count: r.count,
                badgeClass: STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600',
              }))}
              total={summary.total}
            />

            {/* By Priority */}
            <BreakdownTable
              title="By Priority"
              rows={byPriority.map((r: { priority: string; count: number }) => ({
                label: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
                count: r.count,
                badgeClass: PRIORITY_COLORS[r.priority] ?? 'bg-gray-100 text-gray-600',
              }))}
              total={summary.total}
            />

            {/* By Project */}
            <BreakdownTable
              title="By Project"
              rows={byProject.map((r: { project: { name: string } | null; count: number }) => ({
                label: r.project?.name ?? 'No Project',
                count: r.count,
              }))}
              total={summary.total}
            />

            {/* By Assignee */}
            <BreakdownTable
              title="By Assignee"
              rows={byAssignee.map((r: { user: { name: string }; count: number }) => ({
                label: r.user.name,
                count: r.count,
              }))}
              total={summary.total}
            />
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownTable({ title, rows, total }: {
  title: string;
  rows: { label: string; count: number; badgeClass?: string }[];
  total: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">No data</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  {row.badgeClass ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.badgeClass}`}>
                      {row.label}
                    </span>
                  ) : (
                    <span className="text-gray-700">{row.label}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{row.count}</td>
                <td className="px-5 py-3 text-right text-gray-400 text-xs w-20">
                  {total > 0 ? `${Math.round((row.count / total) * 100)}%` : '—'}
                </td>
                <td className="px-5 py-3 w-24">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: total > 0 ? `${(row.count / total) * 100}%` : '0%' }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
