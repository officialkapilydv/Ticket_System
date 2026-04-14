# Ticket System — Setup Guide

## Prerequisites
- PHP 8.2+, Composer
- Node.js 18+, npm
- MySQL (via XAMPP/phpMyAdmin)

---

## Step 1: Database Setup

1. Open phpMyAdmin → create a database named `ticket_system`
2. If your MySQL root user has a password, update `backend/.env`:
   ```
   DB_PASSWORD=your_password
   ```

---

## Step 2: Backend Setup

```bash
cd backend

# Install PHP dependencies (if not already done)
composer install

# Run migrations
php artisan migrate

# Seed demo data (admin + agents + 30 sample tickets)
php artisan db:seed

# Start the Laravel API server
php artisan serve
# → Running at http://localhost:8000
```

---

## Step 3: Frontend Setup

```bash
cd frontend

# Install JS dependencies (if not already done)
npm install

# Start the dev server
npm run dev
# → Running at http://localhost:5173
```

---

## Step 4: Login

Open `http://localhost:5173` in your browser.

| Role  | Email                        | Password  |
|-------|------------------------------|-----------|
| Admin | admin@ticketsystem.com       | password  |
| Agent | sarah@ticketsystem.com       | password  |
| Agent | john@ticketsystem.com        | password  |
| User  | alice@ticketsystem.com       | password  |

---

## Project Structure

```
Ticket_System/
├── backend/         ← Laravel API
│   ├── app/
│   │   ├── Enums/          ← TicketStatus, TicketPriority, UserRole
│   │   ├── Events/         ← Domain events
│   │   ├── Listeners/      ← Slack, notifications
│   │   ├── Models/         ← Eloquent models
│   │   ├── Notifications/  ← DB notifications
│   │   ├── Policies/       ← Authorization
│   │   ├── Services/       ← Business logic
│   │   └── Http/
│   │       ├── Controllers/Api/
│   │       ├── Middleware/
│   │       └── Requests/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
│
└── frontend/        ← React + Vite
    └── src/
        ├── api/             ← Axios API calls
        ├── components/      ← Reusable UI
        ├── features/        ← Pages by feature
        ├── store/           ← Zustand stores
        ├── types/           ← TypeScript types
        └── utils/           ← Formatters, helpers
```

---

## API Base URL

All API endpoints: `http://localhost:8000/api/v1/`

Key endpoints:
- `POST /auth/login` — get token
- `GET  /tickets` — list with filters
- `POST /tickets` — create ticket
- `GET  /tickets/{ulid}` — ticket detail
- `GET  /admin/dashboard/summary` — admin stats

---

## Adding Slack Notifications (Future)

1. Create a Slack incoming webhook
2. Add to `backend/.env`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
3. Notifications fire automatically on ticket create/status change
