import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { timeLogsApi } from '@/api/timeLogs';
import { adminApi } from '@/api/admin';

// ── helpers ───────────────────────────────────────────────────────────────────

function thisMonthRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

function fmtHours(h: number) {
  return h % 1 === 0 ? String(h) : h.toFixed(2).replace(/\.?0+$/, '');
}

function fmtDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') ? `"${s}"` : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url   = URL.createObjectURL(blob);
  const a     = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function exportTxt(filename: string, headers: string[], rows: (string | number)[][]) {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2
  );
  const pad  = (v: string | number, w: number) => String(v).padEnd(w);
  const rule = colWidths.map(w => '-'.repeat(w)).join('');
  const lines = [
    rule,
    headers.map((h, i) => pad(h, colWidths[i])).join(''),
    rule,
    ...rows.map(r => r.map((v, i) => pad(v, colWidths[i])).join('')),
    rule,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ── types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  user: { id: number; name: string; email: string };
  total_hours: number;
  total_minutes: number;
  entries: number;
}

interface LogEntry {
  id: number;
  logged_date: string;
  created_at: string;
  minutes: number;
  description?: string;
  user: { id: number; name: string };
  task?: {
    ulid: string;
    title: string;
    status: string;
    project?: { id: number; name: string };
  };
}

interface TaskRow {
  task?: {
    ulid: string;
    title: string;
    status: string;
    assignees?: { id: number; name: string }[];
  };
  project?: { id: number; name: string };
  assignees?: { id: number; name: string }[];
  total_hours: number;
  total_minutes: number;
}

interface ProjectRow {
  project: { id: number; name: string };
  total_hours: number;
  total_minutes: number;
  entries: number;
}

// ── export rows builders ──────────────────────────────────────────────────────

function ExportBar({ onCsv, onTxt }: { onCsv: () => void; onTxt: () => void }) {
  return (
    <div className="text-sm text-gray-500 flex items-center gap-1">
      Export:
      <button onClick={onCsv} className="text-indigo-600 hover:underline ml-1">.csv</button>
      <span className="text-gray-300 mx-1">|</span>
      <button onClick={onTxt} className="text-indigo-600 hover:underline">.txt</button>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export function TimeReportPage() {
  const [range, setRange]             = useState(thisMonthRange);
  const [pendingRange, setPending]    = useState(thisMonthRange);
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [discFilter, setDiscFilter]   = useState<'all' | 'has_hours' | 'no_hours'>('all');
  const [showFilters, setShowFilters] = useState(true);

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => adminApi.listUsers({ page: 1 }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['full-report', range, selectedUser],
    queryFn: () => timeLogsApi.fullReport(range.from, range.to, selectedUser || undefined),
  });

  const byUser: UserRow[]     = data?.by_user    ?? [];
  const logs: LogEntry[]      = data?.logs        ?? [];
  const byTask: TaskRow[]     = data?.by_task     ?? [];
  const byProject: ProjectRow[] = data?.by_project  ?? [];

  // Apply discrepancy filter to users table
  const filteredUsers = byUser.filter(row => {
    if (discFilter === 'has_hours') return row.total_hours > 0;
    if (discFilter === 'no_hours')  return row.total_hours === 0;
    return true;
  });

  const totalUserHours    = filteredUsers.reduce((s, r) => s + r.total_hours, 0);
  const totalLogHours     = logs.reduce((s, l) => s + l.minutes, 0) / 60;
  const totalTaskHours  = byTask.reduce((s, r) => s + r.total_hours, 0);
  const totalProjHours    = byProject.reduce((s, r) => s + r.total_hours, 0);

  // Click a user name → set that user as the filter and re-fetch immediately
  function handleUserClick(userId: number) {
    setSelectedUser(userId);
    // sync the dropdown with the current range so dates don't reset
    setPending(range);
  }

  function applyFilters() {
    setRange(pendingRange);
  }

  // ── export helpers ──────────────────────────────────────────────────────────

  const suffix = `${range.from}_${range.to}`;

  function exportUsers(fmt: 'csv' | 'txt') {
    const h = ['User', 'Work Hours', 'Allocated', 'Discrepancy'];
    const r = [
      ...filteredUsers.map(u => [u.user.name, fmtHours(u.total_hours), 0, `-${fmtHours(u.total_hours)}`]),
      ['Total', fmtHours(totalUserHours), 0, `-${fmtHours(totalUserHours)}`],
    ];
    fmt === 'csv' ? exportCsv(`users-${suffix}.csv`, h, r) : exportTxt(`users-${suffix}.txt`, h, r);
  }

  function exportTimeLogs(fmt: 'csv' | 'txt') {
    const h = ['Date', 'User', 'Work Hours', 'Task', 'Task Status', 'Project'];
    const r = [
      ...logs.map(l => [
        fmtDatetime(l.created_at),
        l.user.name,
        fmtHours(l.minutes / 60),
        l.task?.title ?? '—',
        l.task?.status ?? '—',
        l.task?.project?.name ?? '—',
      ]),
      ['', '', fmtHours(totalLogHours), '', '', ''],
    ];
    fmt === 'csv' ? exportCsv(`timelogs-${suffix}.csv`, h, r) : exportTxt(`timelogs-${suffix}.txt`, h, r);
  }

  function exportTasks(fmt: 'csv' | 'txt') {
    const h = ['Project', 'Task', 'Assigned To', 'Work Hours', 'Allocated', 'Discrepancy', 'Task Status'];
    const r = [
      ...byTask.map(t => [
        t.project?.name ?? '—',
        t.task?.title ?? '—',
        t.assignees?.map((a: { name: string }) => a.name).join(', ') || '—',
        fmtHours(t.total_hours),
        0,
        `-${fmtHours(t.total_hours)}`,
        t.task?.status ?? '—',
      ]),
      ['', '', '', fmtHours(totalTaskHours), 0, `-${fmtHours(totalTaskHours)}`, ''],
    ];
    fmt === 'csv' ? exportCsv(`tasks-${suffix}.csv`, h, r) : exportTxt(`tasks-${suffix}.txt`, h, r);
  }

  function exportProjects(fmt: 'csv' | 'txt') {
    const h = ['Project', 'Work Hours', 'Allocated', 'Discrepancy'];
    const r = [
      ...byProject.map(p => [p.project.name, fmtHours(p.total_hours), 0, `-${fmtHours(p.total_hours)}`]),
      ['Total', fmtHours(totalProjHours), 0, `-${fmtHours(totalProjHours)}`],
    ];
    fmt === 'csv' ? exportCsv(`projects-${suffix}.csv`, h, r) : exportTxt(`projects-${suffix}.txt`, h, r);
  }

  // ── group logs by date for the Time Log table ───────────────────────────────
  const logsByDate = logs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const date = log.logged_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Users Time Report</h2>

      {/* Filters panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 w-full px-5 py-3 bg-blue-50 border-b border-gray-200 text-sm font-medium text-gray-700 hover:bg-blue-100 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showFilters ? '' : '-rotate-90'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Filters
        </button>

        {showFilters && (
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">User:</label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Users</option>
                  {usersData?.data?.map((u: { id: number; name: string }) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Discrepancy:</label>
                <select
                  value={discFilter}
                  onChange={e => setDiscFilter(e.target.value as typeof discFilter)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="has_hours">Has Logged Hours</option>
                  <option value="no_hours">No Hours Logged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">From:</label>
                <input
                  type="date"
                  value={pendingRange.from}
                  onChange={e => setPending(p => ({ ...p, from: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">To:</label>
                  <input
                    type="date"
                    value={pendingRange.to}
                    onChange={e => setPending(p => ({ ...p, to: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Filter By Dates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading || isFetching ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading report…</div>
      ) : (
        <>
          {/* ── Users ─────────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Users</h3>
            <ExportBar onCsv={() => exportUsers('csv')} onTxt={() => exportUsers('txt')} />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">User</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Work Hours</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Allocated</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        No time logged for this period.
                      </td>
                    </tr>
                  ) : filteredUsers.map(row => (
                    <tr key={row.user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleUserClick(row.user.id)}
                          className="text-indigo-600 hover:underline font-medium text-left"
                        >
                          {row.user.name}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{fmtHours(row.total_hours)}</td>
                      <td className="px-5 py-3 text-gray-700">0</td>
                      <td className="px-5 py-3 text-red-500 font-medium">-{fmtHours(row.total_hours)}</td>
                    </tr>
                  ))}
                </tbody>
                {filteredUsers.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    <tr>
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3 font-bold text-gray-900">{fmtHours(totalUserHours)}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">0</td>
                      <td className="px-5 py-3 font-bold text-red-500">-{fmtHours(totalUserHours)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {/* ── Time Log & Tickets — only shown when a specific user is selected ── */}
          {selectedUser !== '' && (
            <>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Time Log</h3>
            <ExportBar onCsv={() => exportTimeLogs('csv')} onTxt={() => exportTimeLogs('txt')} />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">User</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Work Hours</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Task</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Task Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        No time log entries for this period.
                      </td>
                    </tr>
                  ) : Object.entries(logsByDate).map(([date, dateEntries]) => (
                    <>
                      {/* Date group header */}
                      <tr key={`header-${date}`} className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-2 font-bold text-gray-800">
                          {fmtDate(date)}
                        </td>
                      </tr>
                      {dateEntries.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                            {fmtDatetime(log.created_at)}
                          </td>
                          <td className="px-5 py-3 text-gray-700">{log.user.name}</td>
                          <td className="px-5 py-3 text-gray-700">{fmtHours(log.minutes / 60)}</td>
                          <td className="px-5 py-3">
                            {log.task ? (
                              <Link
                                to={`/tasks/${log.task.ulid}`}
                                className="text-indigo-600 hover:underline"
                              >
                                {log.task.title}
                              </Link>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3 text-gray-600 capitalize">
                            {log.task?.status?.replace(/_/g, ' ') ?? '—'}
                          </td>
                          <td className="px-5 py-3">
                            {log.task?.project ? (
                              <Link
                                to={`/projects/${log.task.project.id}`}
                                className="text-indigo-600 hover:underline"
                              >
                                {log.task.project.name}
                              </Link>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Date subtotal */}
                      <tr key={`total-${date}`} className="bg-gray-50 border-t border-gray-200">
                        <td className="px-5 py-2" />
                        <td className="px-5 py-2" />
                        <td className="px-5 py-2 font-bold text-gray-900">
                          {fmtHours(dateEntries.reduce((s, l) => s + l.minutes, 0) / 60)}
                        </td>
                        <td colSpan={3} className="px-5 py-2" />
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Tasks ─────────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
            <ExportBar onCsv={() => exportTasks('csv')} onTxt={() => exportTasks('txt')} />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Project</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Task</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Work Hours</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Allocated</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Discrepancy</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Task Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byTask.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        No tasks with logged time for this period.
                      </td>
                    </tr>
                  ) : byTask.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        {row.project ? (
                          <Link to={`/projects/${row.project.id}`} className="text-indigo-600 hover:underline">
                            {row.project.name}
                          </Link>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {row.task ? (
                          <Link to={`/tasks/${row.task.ulid}`} className="text-indigo-600 hover:underline">
                            {row.task.title}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {row.assignees && row.assignees.length > 0
                          ? row.assignees.map((a: { name: string }) => a.name).join(', ')
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{fmtHours(row.total_hours)}</td>
                      <td className="px-5 py-3 text-gray-700">0</td>
                      <td className="px-5 py-3 text-red-500 font-medium">-{fmtHours(row.total_hours)}</td>
                      <td className="px-5 py-3 text-gray-600 capitalize">
                        {row.task?.status?.replace(/_/g, ' ') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {byTask.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    <tr>
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3 font-bold text-gray-900">{fmtHours(totalTaskHours)}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">0</td>
                      <td className="px-5 py-3 font-bold text-red-500">-{fmtHours(totalTaskHours)}</td>
                      <td className="px-5 py-3" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

            </>
          )}

          {/* ── Projects ──────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
            <ExportBar onCsv={() => exportProjects('csv')} onTxt={() => exportProjects('txt')} />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Project</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Work Hours</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Allocated</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byProject.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        No project time logged for this period.
                      </td>
                    </tr>
                  ) : byProject.map(row => (
                    <tr key={row.project.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/projects/${row.project.id}`} className="text-indigo-600 hover:underline font-medium">
                          {row.project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{fmtHours(row.total_hours)}</td>
                      <td className="px-5 py-3 text-gray-700">0</td>
                      <td className="px-5 py-3 text-red-500 font-medium">-{fmtHours(row.total_hours)}</td>
                    </tr>
                  ))}
                </tbody>
                {byProject.length > 0 && (
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    <tr>
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3 font-bold text-gray-900">{fmtHours(totalProjHours)}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">0</td>
                      <td className="px-5 py-3 font-bold text-red-500">-{fmtHours(totalProjHours)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
