import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { ticketsApi } from '@/api/tickets';
import { partnersApi } from '@/api/partners';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, formatRelative } from '@/utils/formatters';

const STATUSES = ['', 'open', 'in_progress', 'in_review', 'resolved', 'closed'];
const PRIORITIES = ['', 'critical', 'high', 'medium', 'low'];

export function TicketListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { search, status, priority, partnerId, projectId, page }],
    queryFn: () => ticketsApi.list({
      'filter[title]': search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      partner_id: partnerId ? Number(partnerId) : undefined,
      project_id: projectId ? Number(projectId) : undefined,
      page,
    }),
    placeholderData: (prev) => prev,
  });

  const { data: partners } = useQuery({ queryKey: ['partners'], queryFn: partnersApi.list });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total tickets</p>
        </div>
        <Link to="/tickets/new">
          <Button>
            <Plus size={16} />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <select
            value={partnerId}
            onChange={(e) => { setPartnerId(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Partners</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company ? `${p.name} (${p.company})` : p.name}
              </option>
            ))}
          </select>
          <select
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading tickets...</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No tickets found.</p>
            <Link to="/tickets/new" className="text-indigo-600 text-sm mt-2 block hover:underline">
              Create your first ticket
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/tickets/${ticket.ulid}`} className="block">
                      <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                        {ticket.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 font-mono">{ticket.ulid.slice(-8)}</span>
                        {ticket.project && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: ticket.project.color + '20', color: ticket.project.color }}
                          >
                            {ticket.project.key}
                          </span>
                        )}
                        {ticket.category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: ticket.category.color + '20', color: ticket.category.color }}
                          >
                            {ticket.category.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-6 py-4">
                    {ticket.assignees && ticket.assignees.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {ticket.assignees.slice(0, 3).map((a) => (
                            <Avatar key={a.id} src={a.avatar_url} name={a.name} size="sm" className="ring-2 ring-white" />
                          ))}
                        </div>
                        {ticket.assignees.length === 1 && (
                          <span className="text-gray-700 text-sm">{ticket.assignees[0].name}</span>
                        )}
                        {ticket.assignees.length > 3 && (
                          <span className="text-xs text-gray-500">+{ticket.assignees.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(ticket.due_date)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatRelative(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * data.per_page + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
