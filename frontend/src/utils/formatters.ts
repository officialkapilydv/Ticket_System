import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return format(parseISO(date), 'MMM d, yyyy HH:mm');
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const LABEL_OPTIONS = [
  { value: 'new',             label: 'New' },
  { value: 'qa_reported',     label: 'QA Reported' },
  { value: 'client_reported', label: 'Client Reported' },
  { value: 'reporting',       label: 'Reporting' },
  { value: 'idea',            label: 'Idea' },
] as const;

export const LABEL_LABELS: Record<string, string> = {
  new:             'New',
  qa_reported:     'QA Reported',
  client_reported: 'Client Reported',
  reporting:       'Reporting',
  idea:            'Idea',
};

export const LABEL_COLORS: Record<string, string> = {
  new:             'bg-sky-100 text-sky-700',
  qa_reported:     'bg-orange-100 text-orange-700',
  client_reported: 'bg-rose-100 text-rose-700',
  reporting:       'bg-violet-100 text-violet-700',
  idea:            'bg-emerald-100 text-emerald-700',
};
