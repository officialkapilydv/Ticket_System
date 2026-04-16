import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Ticket, Clock, MessageSquare, UserCheck, Tag, Search } from 'lucide-react';
import type { AiChatResponse } from '@/api/ai';

interface Props {
  action: AiChatResponse['action_taken'];
  toolName?: string;
}

const TOOL_LABELS: Record<string, string> = {
  create_ticket:        'Ticket Created',
  update_ticket:        'Ticket Updated',
  search_tickets:       'Search Results',
  get_ticket:           'Ticket Details',
  add_comment:          'Comment Added',
  log_time:             'Time Logged',
  assign_user:          'Assignee Updated',
  change_ticket_status: 'Status Changed',
};

const TOOL_ICONS: Record<string, React.ElementType> = {
  create_ticket:        Ticket,
  update_ticket:        Ticket,
  search_tickets:       Search,
  get_ticket:           Ticket,
  add_comment:          MessageSquare,
  log_time:             Clock,
  assign_user:          UserCheck,
  change_ticket_status: Tag,
};

export function AiActionCard({ action, toolName }: Props) {
  if (!action) return null;

  const label  = toolName ? TOOL_LABELS[toolName] ?? 'Action Completed' : 'Action Completed';
  const Icon   = toolName ? (TOOL_ICONS[toolName] ?? CheckCircle) : CheckCircle;
  const isOk   = action.success !== false;

  if (!isOk) {
    return (
      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-red-700">{action.error ?? 'Action failed.'}</span>
      </div>
    );
  }

  // Search results
  if (toolName === 'search_tickets' && action.tickets) {
    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {action.tickets.length} ticket{action.tickets.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <div className="space-y-1.5">
          {action.tickets.map((t) => (
            <Link
              key={t.ulid}
              to={t.url}
              className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:border-blue-300 transition-colors group"
            >
              <span className="text-sm text-gray-800 group-hover:text-indigo-600 truncate max-w-[200px]">
                {t.title}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-green-600 flex-shrink-0" />
        <span className="text-sm font-medium text-green-800">{label}</span>
      </div>

      {/* Ticket link */}
      {action.url && action.url.startsWith('/tickets/') && (
        <Link
          to={action.url}
          className="mt-1.5 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {action.title ?? action.ticket_ulid ?? 'View ticket'} →
        </Link>
      )}

      {/* Time log details */}
      {toolName === 'log_time' && action.hours !== undefined && (
        <p className="mt-1 text-xs text-green-700">
          {action.hours}h logged on {action.logged_date}
        </p>
      )}

      {/* Status change */}
      {toolName === 'change_ticket_status' && action.new_status && (
        <p className="mt-1 text-xs text-green-700 capitalize">
          Status → {action.new_status.replace('_', ' ')}
        </p>
      )}

      {/* Assign */}
      {toolName === 'assign_user' && action.assignees && (
        <p className="mt-1 text-xs text-green-700">
          Assigned to: {action.assignees}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open:        'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    in_review:   'bg-purple-100 text-purple-700',
    resolved:    'bg-green-100 text-green-700',
    closed:      'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low:      'bg-gray-100 text-gray-600',
    medium:   'bg-blue-100 text-blue-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${colors[priority] ?? 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  );
}
