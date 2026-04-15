import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '@/api/reports';

interface ProjectStat {
  project: { id: number; name: string; key: string; color: string; status: string };
  owner: { id: number; name: string } | null;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  overdue_tickets: number;
  milestones_count: number;
  total_hours: number;
}

interface Totals {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  overdue_tickets: number;
  total_hours: number;
}

export function ProjectReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-projects'],
    queryFn: reportsApi.projects,
  });

  const projects: ProjectStat[] = data?.projects ?? [];
  const totals: Totals = data?.totals ?? {
    total_tickets: 0, open_tickets: 0, resolved_tickets: 0,
    closed_tickets: 0, overdue_tickets: 0, total_hours: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Ticket counts and hours logged per project</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No projects found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Project</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Owner</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Open</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Resolved</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Closed</th>
                <th className="text-center px-4 py-3 font-semibold text-red-600">Overdue</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Milestones</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Hours Logged</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((row) => (
                <tr key={row.project.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.project.color }}
                      />
                      <Link
                        to={`/projects/${row.project.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {row.project.name}
                      </Link>
                      <span className="text-xs text-gray-400 font-mono">{row.project.key}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.owner?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-900">{row.total_tickets}</td>
                  <td className="px-4 py-3 text-center text-blue-600">{row.open_tickets}</td>
                  <td className="px-4 py-3 text-center text-green-600">{row.resolved_tickets}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.closed_tickets}</td>
                  <td className="px-4 py-3 text-center text-red-500 font-medium">{row.overdue_tickets}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.milestones_count}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.total_hours}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      row.project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {row.project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300 bg-gray-50">
              <tr>
                <td className="px-5 py-3 font-bold text-gray-700">Totals</td>
                <td className="px-5 py-3" />
                <td className="px-4 py-3 text-center font-bold text-gray-900">{totals.total_tickets}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">{totals.open_tickets}</td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{totals.resolved_tickets}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-500">{totals.closed_tickets}</td>
                <td className="px-4 py-3 text-center font-bold text-red-500">{totals.overdue_tickets}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-center font-bold text-gray-900">{totals.total_hours}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
