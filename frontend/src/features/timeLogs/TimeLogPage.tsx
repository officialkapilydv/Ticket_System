import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeLogsApi } from '@/api/timeLogs';
import { minutesToHours, formatDate } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

function getWeekRange() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  };
}

export function TimeLogPage() {
  const [range, setRange] = useState(getWeekRange);

  const { data, isLoading } = useQuery({
    queryKey: ['my-report', range],
    queryFn: () => timeLogsApi.myReport(range.from, range.to),
  });

  const prevWeek = () => {
    const from = new Date(range.from);
    from.setDate(from.getDate() - 7);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    setRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] });
  };

  const nextWeek = () => {
    const from = new Date(range.from);
    from.setDate(from.getDate() + 7);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    setRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Time Logs</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevWeek}>← Prev Week</Button>
          <span className="text-sm text-gray-600 font-medium">
            {formatDate(range.from)} – {formatDate(range.to)}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>Next Week →</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Hours This Period</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {isLoading ? '...' : minutesToHours(data?.total_minutes ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Entries</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? '...' : data?.logs?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Time Entries</h3>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (data?.logs?.length ?? 0) === 0 ? (
          <div className="text-center py-12 text-gray-400">No time logged this period.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.logs?.map((log: { id: number; logged_date: string; ticket: { ulid: string; title: string }; description?: string; minutes: number }) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600">{formatDate(log.logged_date)}</td>
                  <td className="px-6 py-3">
                    <Link to={`/tickets/${log.ticket?.ulid}`} className="text-indigo-600 hover:underline">
                      {log.ticket?.title ?? '—'}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{log.description ?? '—'}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">{minutesToHours(log.minutes)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-700">Total</td>
                <td className="px-6 py-3 text-right font-bold text-indigo-600">
                  {minutesToHours(data?.total_minutes ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
