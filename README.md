# Ticket System

A modern, full-stack internal ticket management system built with **Laravel** (REST API) and **React + Vite** (SPA). Designed for small-to-medium teams who need a clean, fast alternative to heavyweight tools like JIRA.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Authentication & Security](#authentication--security)
- [REST API](#rest-api)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)
- [Future Integrations](#future-integrations)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand (client), React Query (server) |
| HTTP Client | Axios |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Laravel (latest stable) |
| Authentication | Laravel Sanctum (Bearer tokens) |
| Database | MySQL 8.0 |
| DB GUI | phpMyAdmin |
| Dev Infrastructure | Docker Desktop |
| API Filtering | spatie/laravel-query-builder |

---

## Project Structure

```
Ticket_System/
│
├── docker-compose.yml          ← MySQL + phpMyAdmin containers
├── SETUP.md                    ← Quick start reference
│
├── backend/                    ← Laravel REST API
│   ├── app/
│   │   ├── Enums/              ← TicketStatus, TicketPriority, UserRole, AuditEvent
│   │   ├── Events/             ← TicketCreated, TicketAssigned, CommentPosted, etc.
│   │   ├── Listeners/          ← SendSlackNotification, NotifyMentionedUsers, etc.
│   │   ├── Models/             ← Eloquent models with relationships
│   │   ├── Notifications/      ← Database notifications (assignment, mentions)
│   │   ├── Policies/           ← TicketPolicy, CommentPolicy
│   │   ├── Services/           ← Business logic (TicketService, TimeLogService, etc.)
│   │   └── Http/
│   │       ├── Controllers/Api/    ← All API controllers
│   │       ├── Middleware/         ← EnsureIsAdmin, EnsureUserIsActive
│   │       └── Requests/          ← Form request validation classes
│   ├── database/
│   │   ├── migrations/         ← 8 migration files
│   │   └── seeders/            ← Demo data (users, categories, tickets)
│   └── routes/
│       └── api.php             ← 40 versioned API routes (/api/v1/*)
│
└── frontend/                   ← React + Vite SPA
    └── src/
        ├── api/                ← Axios API functions per resource
        ├── components/
        │   ├── ui/             ← Button, Badge, Avatar, Modal, Input, ErrorBoundary
        │   └── layout/         ← AppShell, Sidebar, Header
        ├── features/
        │   ├── auth/           ← LoginPage, ProtectedRoute, AdminRoute
        │   ├── tickets/        ← TicketListPage, TicketDetailPage, TicketForm
        │   ├── dashboard/      ← AdminDashboardPage (charts + stats)
        │   ├── timeLogs/       ← TimeLogPage (weekly report)
        │   └── admin/          ← AdminUsersPage, AdminCategoriesPage
        ├── store/              ← authStore (Zustand), uiStore (Zustand)
        ├── types/              ← TypeScript interfaces for all entities
        ├── utils/              ← Formatters (date, time, status labels)
        └── routes/             ← React Router v7 route definitions
```

---

## Features

### Authentication & Users
- Secure login / logout with Bearer token auth (Laravel Sanctum)
- Three roles: **Admin**, **Agent**, **User**
- Role-based access control on both backend (policies + middleware) and frontend (route guards)
- User profile management with avatar upload
- Admin can create, update, activate/deactivate users

### Ticket Management
- Create, edit, delete tickets
- Fields: Title, Description, Priority, Status, Category, Assignee, Due Date, Estimated Hours
- Status workflow: `Open → In Progress → In Review → Resolved → Closed`
- Priority levels: `Low / Medium / High / Critical`
- Ticket assignment with notifications
- File attachments (upload, download, delete)
- Full audit trail (every change logged with old/new values)

### Comments & Collaboration
- Threaded comments on tickets
- `@mention` support — mentioned users get notified
- Internal (staff-only) comment flag

### Time Tracking
- Log time spent per ticket (date, minutes, description)
- Personal weekly time report with totals
- Admin time report across all users and tickets

### Admin Dashboard
- Live stats: total tickets, open count, overdue, active users
- Bar chart — tickets created in the last 7 days
- Pie chart — breakdown by status
- Priority progress bars
- Recent ticket activity table
- Category management with color picker

---

## Authentication & Security

The entire system uses **REST API + Bearer token authentication** via Laravel Sanctum.

### How It Works

```
React Frontend                      Laravel Backend
──────────────                      ───────────────────────────────
POST /api/v1/auth/login      ──→    Validates email + password
{ email, password }          ←──    Returns { token, user }

Stores token:
  localStorage + Zustand

Every API request            ──→    auth:sanctum middleware
Authorization: Bearer <token>       Looks up personal_access_tokens
                                    Loads User → injects to $request->user()
                             ←──    401 if missing or invalid
```

### Backend — Three Layers of Protection

| Layer | Implementation | Scope |
|---|---|---|
| Token validation | `auth:sanctum` middleware | All routes except `/auth/login` |
| Account status | `EnsureUserIsActive` middleware | Blocks deactivated accounts |
| Role enforcement | `EnsureIsAdmin` middleware | All `/admin/*` routes |
| Resource ownership | Laravel Policies (`TicketPolicy`, `CommentPolicy`) | Per-object authorization |

**Policy example** — who can edit a ticket:
```php
// Only admin, the reporter, or the assignee can update
public function update(User $user, Ticket $ticket): bool
{
    return $user->isAdmin()
        || $ticket->reporter_id === $user->id
        || $ticket->assignee_id === $user->id;
}
```

### Frontend — Two Layers of Protection

**1. Axios interceptors** (`src/api/client.ts`) — runs on every HTTP request:
```ts
// Automatically attaches token to all requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirects to /login on any 401 response
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**2. React Router guards** (`src/features/auth/ProtectedRoute.tsx`):
```ts
// Unauthenticated → redirect to /login
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Non-admin → redirect to /tickets
export function AdminRoute() {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/tickets" replace />;
  return <Outlet />;
}
```

### Full Request Lifecycle

```
User visits /tickets
      │
      ▼
ProtectedRoute checks Zustand token
      │ no token ──→ redirect /login
      │ has token
      ▼
React Query calls ticketsApi.list()
      │
      ▼
Axios adds: Authorization: Bearer 1|abc123...
      │
      ▼
Laravel: auth:sanctum validates token
      │ invalid ──→ 401 ──→ Axios interceptor ──→ /login
      │ valid
      ▼
EnsureUserIsActive middleware
      │ inactive ──→ 403
      │ active
      ▼
TicketController::index()
  filters + paginates → returns JSON
      │
      ▼
React Query caches + renders page
```

---

## REST API

**Base URL:** `http://localhost:8000/api/v1/`

All responses are JSON. All protected routes require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns token |
| POST | `/auth/logout` | Revoke current token |
| GET | `/auth/me` | Get authenticated user |
| PUT | `/auth/profile` | Update profile |
| PUT | `/auth/password` | Change password |

### Tickets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets` | List tickets (filterable, paginated) |
| POST | `/tickets` | Create ticket |
| GET | `/tickets/{ulid}` | Get ticket detail |
| PUT | `/tickets/{ulid}` | Update ticket |
| DELETE | `/tickets/{ulid}` | Delete ticket |
| PATCH | `/tickets/{ulid}/status` | Change status |
| POST | `/tickets/{ulid}/assign` | Assign to user |
| GET | `/tickets/{ulid}/history` | Audit log |

### Ticket Filters (query params)
```
GET /api/v1/tickets?filter[status]=open&filter[priority]=high&filter[title]=bug&sort=-created_at&page=1&per_page=20
```

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets/{ulid}/comments` | List comments |
| POST | `/tickets/{ulid}/comments` | Post comment |
| PUT | `/tickets/{ulid}/comments/{id}` | Edit comment |
| DELETE | `/tickets/{ulid}/comments/{id}` | Delete comment |

### Attachments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tickets/{ulid}/attachments` | Upload file |
| DELETE | `/tickets/{ulid}/attachments/{id}` | Delete file |
| GET | `/tickets/{ulid}/attachments/{id}/download` | Download file |

### Time Logs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets/{ulid}/time-logs` | List time logs |
| POST | `/tickets/{ulid}/time-logs` | Log time |
| PUT | `/tickets/{ulid}/time-logs/{id}` | Edit log entry |
| DELETE | `/tickets/{ulid}/time-logs/{id}` | Delete log entry |
| GET | `/time-logs/report?from=&to=` | Personal time report |

### Admin (requires admin role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard/summary` | Dashboard stats + charts data |
| GET | `/admin/dashboard/time-report` | Team time report |
| GET | `/admin/dashboard/ticket-stats` | Avg resolution, top assignees |
| GET | `/users` | List all users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/{id}` | Update user |
| PATCH | `/admin/users/{id}/deactivate` | Toggle active status |
| GET | `/categories` | List categories |
| POST | `/admin/categories` | Create category |
| DELETE | `/admin/categories/{id}` | Delete category |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Unread count |
| POST | `/notifications/read-all` | Mark all as read |
| PATCH | `/notifications/{id}/read` | Mark one as read |

---

## Database Schema

```
users
  id, name, email, password, avatar, timezone
  role (admin/agent/user), is_active
  created_at, updated_at, deleted_at

categories
  id, name, slug, color, icon, description
  parent_id (self-referencing, for sub-categories)

tickets
  id, ulid (public ID), title, description
  status, priority, category_id
  reporter_id → users, assignee_id → users
  due_date, estimated_hours, resolved_at
  jira_issue_key (future JIRA sync)

ticket_attachments
  id, ticket_id, uploaded_by → users
  filename, disk_path, mime_type, file_size

ticket_comments
  id, ticket_id, user_id, parent_id (threading)
  body, is_internal

comment_mentions
  id, comment_id, mentioned_user_id, notified_at

ticket_time_logs
  id, ticket_id, user_id, logged_date, minutes, description

ticket_audit_logs
  id, ticket_id, user_id, event
  old_values (JSON), new_values (JSON), created_at

notifications (Laravel built-in)
  id (uuid), type, notifiable_type, notifiable_id
  data (JSON), read_at
```

---

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- PHP 8.2+ and Composer
- Node.js 18+ and npm

### Step 1 — Start the database

```bash
# From the project root
docker compose up -d
```

This starts:
- **MySQL 8.0** on port `3306`
- **phpMyAdmin** on `http://localhost:8080`

Wait ~15 seconds for MySQL to initialize, then verify:
```bash
docker compose ps
# Both containers should show "running"
```

### Step 2 — Backend setup

```bash
cd backend

# Install PHP dependencies
composer install

# Run all database migrations
php artisan migrate

# Seed demo data (users, categories, 30 sample tickets)
php artisan db:seed

# Create storage symlink for file uploads
php artisan storage:link

# Start the API server
php artisan serve
# → API running at http://localhost:8000
```

### Step 3 — Frontend setup

Open a second terminal:

```bash
cd frontend

# Copy the example env file and set your API URL
cp .env.example .env
# Edit .env if needed — default points to http://localhost:8000/api/v1

# Install JS dependencies
npm install

# Start the dev server
npm run dev
# → App running at http://localhost:5173
```

### Step 4 — Open the app

Navigate to `http://localhost:5173` and log in.

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ticketsystem.com | password |
| Agent | sarah@ticketsystem.com | password |
| Agent | john@ticketsystem.com | password |
| User | alice@ticketsystem.com | password |
| User | bob@ticketsystem.com | password |
| User | carol@ticketsystem.com | password |

**phpMyAdmin** → `http://localhost:8080` — login: `root` / `secret`

---

## Environment Variables

### Frontend — `frontend/.env`

The API base URL is fully controlled by an environment variable. Vite reads it at **build time**, so changing it requires a rebuild for production.

```env
# Local development (default)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Staging example
VITE_API_BASE_URL=https://staging.yourcompany.com/api/v1

# Production example
VITE_API_BASE_URL=https://api.yourcompany.com/api/v1
```

Vite env files load in this priority order:
```
.env.local          ← highest priority, never commit this
.env.production     ← loaded when running: npm run build
.env.development    ← loaded when running: npm run dev
.env                ← base fallback, always loaded
```

> **Note:** All frontend env variables **must** be prefixed with `VITE_` to be exposed to the browser. Variables without this prefix are server-only and will be `undefined` at runtime.

### Backend — `backend/.env`

Key variables in `backend/.env`:

```env
# App
APP_NAME="Ticket System"
APP_URL=http://localhost:8000

# Database (Docker)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ticket_system
DB_USERNAME=root
DB_PASSWORD=secret

# Frontend origin (for Sanctum CSRF)
SANCTUM_STATEFUL_DOMAINS=localhost:5173
FRONTEND_URL=http://localhost:5173

# Slack (optional — leave empty to disable)
SLACK_WEBHOOK_URL=
SLACK_CHANNEL=#tickets

# JIRA (optional — future integration)
JIRA_HOST=
JIRA_USER=
JIRA_TOKEN=
JIRA_PROJECT_KEY=
```

---

## Docker Commands Reference

```bash
docker compose up -d          # Start all containers (background)
docker compose down           # Stop containers (data preserved)
docker compose down -v        # Stop + delete all data
docker compose ps             # Check container status
docker compose logs mysql     # View MySQL logs
docker compose restart mysql  # Restart MySQL only
```

---

## Future Integrations

The architecture is event-driven, so integrations plug in as Listeners without touching business logic.

### Slack Notifications
1. Create a Slack incoming webhook at `api.slack.com/apps`
2. Add to `backend/.env`:
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
   SLACK_CHANNEL=#tickets
   ```
3. Notifications fire automatically on ticket creation and status changes — no code changes needed.

### JIRA Sync
1. Add JIRA credentials to `backend/.env`
2. `jira_issue_key` column already exists on the `tickets` table for bi-directional sync
3. Implement `JiraService` in `app/Services/Integrations/JiraService.php`
4. Register as a Listener on `TicketCreated` event in `AppServiceProvider`

### Real-time Updates (WebSockets)
Replace polling with Laravel Reverb (official WebSocket server):
```bash
composer require laravel/reverb
php artisan reverb:install
```
Then broadcast events to React via `@laravel/echo`.

### Full-text Search
```bash
composer require laravel/scout
# + install Meilisearch via Docker
```
Adds instant search across ticket titles, descriptions, and comments.

---

## Token Expiry (Optional)

Sanctum tokens do not expire by default. To add expiry, edit `backend/config/sanctum.php`:

```php
// Expire tokens after 7 days (value in minutes)
'expiration' => 60 * 24 * 7,
```

Then schedule automatic cleanup in `routes/console.php`:
```php
Schedule::command('sanctum:prune-expired --hours=168')->daily();
```
