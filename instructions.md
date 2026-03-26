# Task: Build a Full-Stack General Purpose CRM Application

## Overview
Build a production-ready, general-purpose CRM application using **React 19** on the
frontend and **Express 5** on the backend. The app must be fully typed with TypeScript,
follow modern best practices, and be structured for scalability and maintainability.

---

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite 6** (build tool)
- **React Router v7** (client-side routing)
- **TanStack Query v5** (server state + caching)
- **Zustand v5** (client/UI state)
- **React Hook Form v7 + Zod v3** (forms and validation)
- **Tailwind CSS v4 + shadcn/ui** (styling and components)
- **@dnd-kit/core** (drag-and-drop for pipeline board)
- **Recharts v2** (analytics charts)
- **Nodemailer / React Email** (email rendering preview)
- **Axios** (HTTP client with interceptors)

### Backend
- **Node.js 22+** with **Express 5**
- **TypeScript 5**
- **Mongoose 8** (MongoDB ODM)
- **MongoDB 7** (primary database)
- **JWT (jsonwebtoken) + bcryptjs** (authentication)
- **Zod v3** (request/response validation)
- **Nodemailer + Handlebars** (transactional email)
- **Multer** (file uploads — CSV import)
- **Winston + morgan** (structured logging)
- **node-cron** (scheduled follow-up reminders)

---

## Project Structure

```
crm/
├── client/                        # React 19 frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Axios instance + TanStack Query hooks
│   │   │   ├── client.ts          # Axios base client with interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── contacts.api.ts
│   │   │   ├── deals.api.ts
│   │   │   ├── tasks.api.ts
│   │   │   ├── emails.api.ts
│   │   │   └── analytics.api.ts
│   │   ├── components/            # Shared/reusable UI components
│   │   │   ├── ui/                # shadcn/ui base components
│   │   │   ├── DataTable/
│   │   │   ├── KanbanBoard/
│   │   │   ├── ActivityFeed/
│   │   │   └── EmailComposer/
│   │   ├── features/              # Feature-sliced modules
│   │   │   ├── auth/
│   │   │   ├── contacts/
│   │   │   ├── deals/
│   │   │   ├── tasks/
│   │   │   ├── emails/
│   │   │   └── analytics/
│   │   ├── layouts/               # AppShell, Sidebar, Topbar
│   │   ├── pages/                 # Route-level page components
│   │   ├── store/                 # Zustand stores
│   │   ├── hooks/                 # Shared custom hooks
│   │   ├── types/                 # Global TypeScript types/interfaces
│   │   └── lib/                   # Utils, constants, date helpers
│   ├── index.html
│   └── vite.config.ts
│
├── server/                        # Express 5 backend
│   ├── src/
│   │   ├── config/                # DB connection, env, mailer setup
│   │   ├── controllers/           # Route handler functions
│   │   ├── routes/                # Express routers (v5 style)
│   │   ├── middleware/            # Auth guard, error handler, validator
│   │   ├── models/                # Mongoose models + schemas
│   │   ├── services/              # Business logic (decoupled from controllers)
│   │   ├── jobs/                  # node-cron scheduled jobs
│   │   ├── emails/                # Handlebars email templates
│   │   ├── validators/            # Zod schemas per resource
│   │   └── lib/                   # Logger, mailer, upload helpers
│   ├── tsconfig.json
│   └── .env.example
│
├── docker-compose.yml             # MongoDB container for local dev
└── README.md
```

---

## Core Features

### 1. User Authentication & Role-Based Access Control
- Register and login with email/password
- JWT access tokens (15min expiry) + refresh tokens (7-day, httpOnly cookie)
- Refresh token rotation — invalidate old token on each refresh
- Roles: `admin`, `manager`, `agent`
- Middleware-enforced route protection by role
- Admin can invite users via email, assign roles, deactivate accounts
- All passwords hashed with bcryptjs (salt rounds: 12)

### 2. Contacts & Leads Management
- Full CRUD: name, email, phone, company, website, address, tags, notes
- Lead status lifecycle: `new → contacted → qualified → converted → lost`
- Assign contacts to agents; filter by owner, status, tag
- Full-text search across name, email, company
- Pagination and sorting on all list views
- Bulk CSV import via file upload (Multer + stream parsing)
- Contact detail page with:
  - Editable profile fields
  - Linked deals and tasks
  - Activity timeline (calls, emails, notes, status changes)
  - Email composer tab

### 3. Deals / Sales Pipeline
- Kanban board with drag-and-drop (@dnd-kit) across stages:
  `Prospecting → Qualification → Proposal → Negotiation → Won / Lost`
- Deal fields: title, value (currency), close date, probability %, linked contact, assigned agent, notes
- Moving a deal between stages logs an activity entry with timestamp
- List view alternative with sort/filter by value, stage, close date
- Won/Lost marking with reason field

### 4. Tasks & Follow-ups
- Create tasks linked to a contact and/or deal
- Fields: title, description, due date, priority (`low`, `medium`, `high`), status (`pending`, `in_progress`, `done`)
- Assign tasks to any team member
- Dashboard widget: today's tasks + overdue items
- node-cron job: sends email reminder 1 hour before task due date
- Filter by assignee, priority, status, due date range

### 5. Email Integration
- Compose and send emails directly to a contact from within the CRM
- Uses Nodemailer with configurable SMTP (support Gmail OAuth2 or SMTP credentials)
- Handlebars templates for:
  - User invitation email
  - Task due reminder
  - Deal status update notification
  - Password reset
- Sent emails are logged to the contact's activity timeline
- Email thread view per contact (stored in MongoDB)

### 6. Analytics & Reports Dashboard
- KPI cards: total contacts, open deals, pipeline value, tasks due today
- Bar chart: deals by stage (count + total value)
- Line chart: new contacts added over the last 30 days
- Pie chart: deal outcomes (won vs lost vs open) this quarter
- Table: top 5 agents by deals closed
- Date range filter for all charts
- Export report as CSV

---

## MongoDB Schema (Mongoose)

Define the following models with full TypeScript interfaces:

```
User          { name, email, passwordHash, role, isActive, invitedBy, createdAt }
Contact       { name, email, phone, company, website, address, status, tags[],
                ownerId→User, notes, createdAt, updatedAt }
Deal          { title, value, currency, stage, probability, closeDate,
                contactId→Contact, ownerId→User, notes, stageHistory[], createdAt }
Task          { title, description, dueDate, priority, status,
                contactId→Contact, dealId→Deal, assignedTo→User, createdAt }
Activity      { type, description, metadata{}, contactId→Contact,
                dealId→Deal, userId→User, createdAt }
Email         { subject, body, to, from, contactId→Contact,
                sentBy→User, sentAt, status }
RefreshToken  { token, userId→User, expiresAt, createdAt }
```

Use Mongoose indexes on frequently queried fields:
- `Contact`: email (unique), ownerId, status, tags
- `Deal`: ownerId, stage, closeDate
- `Task`: assignedTo, dueDate, status
- `Activity`: contactId, dealId, createdAt
- `Email`: contactId, sentAt

---

## REST API Design

All responses use a consistent envelope:
```json
{ "success": true, "data": {}, "message": "OK", "pagination": {} }
```

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token
```

### Contacts
```
GET    /api/contacts              # paginated, filterable, searchable
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id
POST   /api/contacts/import       # CSV upload
GET    /api/contacts/:id/activity
GET    /api/contacts/:id/emails
```

### Deals
```
GET    /api/deals
POST   /api/deals
GET    /api/deals/:id
PUT    /api/deals/:id
DELETE /api/deals/:id
PATCH  /api/deals/:id/stage
```

### Tasks
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/status
DELETE /api/tasks/:id
```

### Emails
```
POST   /api/emails/send           # compose & send to contact
GET    /api/emails/:contactId     # thread view per contact
```

### Analytics
```
GET    /api/analytics/summary
GET    /api/analytics/deals-by-stage
GET    /api/analytics/contacts-over-time
GET    /api/analytics/deal-outcomes
GET    /api/analytics/top-agents
GET    /api/analytics/export      # CSV download
```

### Users (Admin only)
```
GET    /api/users
POST   /api/users/invite
PATCH  /api/users/:id/role
PATCH  /api/users/:id/deactivate
```

---

## Non-Functional Requirements

- **Validation**: Every request body and query param validated with Zod before hitting controller
- **Error handling**: Central Express error middleware; never leak stack traces to client
- **Security**: helmet, cors (whitelist), express-rate-limit on auth routes, mongo-sanitize
- **Logging**: Winston for structured JSON logs; morgan for HTTP access logs
- **Environment**: All secrets in `.env`; never hardcode; provide `.env.example`
- **No `any` types**: Strictly typed TypeScript throughout — use `unknown` + type guards where needed
- **Responsive UI**: Mobile-friendly sidebar with collapsible nav, works on tablet/desktop
- **Optimistic UI**: TanStack Query mutations should update UI optimistically where appropriate
- **Consistent loading states**: Every data-fetching component handles loading, error, and empty states

---

## Deliverables

1. Complete, runnable codebase matching the structure above
2. Mongoose models with indexes and TypeScript interfaces
3. Database seed script (`server/src/seed.ts`) with realistic sample data:
   - 3 users (admin, manager, agent)
   - 20 contacts across various statuses
   - 10 deals across all pipeline stages
   - 15 tasks (mix of priorities/statuses)
4. `.env.example` for both `client/` and `server/`
5. `docker-compose.yml` spinning up MongoDB locally on port 27017
6. Full `README.md` with:
   - Prerequisites (Node, Docker)
   - Step-by-step local setup
   - Environment variable reference table
   - How to run seed script
   - API overview link or Postman collection

---

## Hard Constraints

- Use **Vite**, never `create-react-app`
- Store refresh tokens in **httpOnly cookies**, never localStorage
- Use **feature-folder** structure on frontend, not flat files
- Use **service layer** on backend — controllers must not contain business logic
- Use **Mongoose virtuals and methods** where appropriate, not raw JS manipulation
- All Zod schemas must be **co-located** with their feature validators folder
- Do **not** use `any` anywhere in TypeScript — enforce with `"strict": true` in tsconfig
________________________________________
This prompt is fully tailored — MongoDB with Mongoose, all 6 features you selected, email integration with Nodemailer/Handlebars, and a clean monorepo structure. Hand it directly to Cursor, Claude Code, or any AI coding agent and it should scaffold the entire project with minimal back-and-forth.

