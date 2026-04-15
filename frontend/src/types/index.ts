// ── User ──────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'agent' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string;
  timezone: string;
  is_active: boolean;
}

// ── Project ───────────────────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'archived';

export interface Project {
  id: number;
  name: string;
  key: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  owner_id: number | null;
  owner: User | null;
  tickets_count?: number;
  milestones_count?: number;
  created_at: string;
  updated_at: string;
}

// ── Milestone ─────────────────────────────────────────────────────────────
export type MilestoneStatus = 'planned' | 'active' | 'completed';

export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  start_date: string | null;
  due_date: string | null;
  tickets_count?: number;
  completed_tickets_count?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
}

// ── Ticket ────────────────────────────────────────────────────────────────
export type TicketStatus   = 'open' | 'in_progress' | 'in_review' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Label {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  parent_id: number | null;
  children?: Category[];
}

export interface Task {
  id: number;
  ulid: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  label_id: number | null;
  label: Label | null;
  project_id: number | null;
  project: Project | null;
  milestone_id: number | null;
  milestone: Milestone | null;
  category_id: number | null;
  reporter_id: number;
  assignees: User[];
  due_date: string | null;
  estimated_hours: number | null;
  progress: number;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter: User;
  category: Category | null;
}

export interface Ticket {
  id: number;
  ulid: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  label_id: number | null;
  label: Label | null;
  partner_id: number | null;
  partner: Partner | null;
  project_id: number | null;
  project: Project | null;
  milestone_id: number | null;
  milestone: Milestone | null;
  category_id: number | null;
  reporter_id: number;
  assignees: User[];
  due_date: string | null;
  estimated_hours: number | null;
  progress: number;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter: User;
  category: Category | null;
  comments_count?: number;
  attachments_count?: number;
  total_hours_logged?: number;
}

// ── Comment Attachment ────────────────────────────────────────────────────
export interface CommentAttachment {
  id: number;
  comment_id: number;
  uploaded_by: number;
  filename: string;
  mime_type: string;
  file_size: number;
  human_size: string;
  url: string;
  is_image: boolean;
  created_at: string;
}

// ── Comment ───────────────────────────────────────────────────────────────
export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  is_internal: boolean;
  minutes: number | null;
  logged_hours: number | null;
  logged_date: string | null;
  created_at: string;
  updated_at: string;
  user: User;
  replies?: Comment[];
  attachments?: CommentAttachment[];
}

// ── Attachment ────────────────────────────────────────────────────────────
export interface Attachment {
  id: number;
  ticket_id: number;
  uploaded_by: number;
  filename: string;
  mime_type: string;
  file_size: number;
  human_size: string;
  url: string;
  created_at: string;
  uploader: User;
}

// ── Time Log ──────────────────────────────────────────────────────────────
export interface TimeLog {
  id: number;
  ticket_id: number;
  user_id: number;
  logged_date: string;
  minutes: number;
  hours: number;
  description: string | null;
  created_at: string;
  user: User;
}

// ── Audit Log ────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  ticket_id: number;
  user_id: number;
  event: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user: User;
}

// ── Notification ──────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: string;
  data: {
    type: string;
    message: string;
    ticket_ulid?: string;
    title?: string;
  };
  read_at: string | null;
  created_at: string;
}

// ── API Pagination ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totals: {
    tickets: number;
    open: number;
    overdue: number;
    users: number;
  };
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
  recent_tickets: Ticket[];
  weekly_created: { date: string; count: number }[];
}
