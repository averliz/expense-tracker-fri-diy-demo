# Expense Tracker — Design Document

**Date:** 2026-03-06
**Status:** Approved

## Overview

A full-stack CRUD expense tracking application with transaction management, category organization, monthly budgets with over-budget alerts, and receipt/invoice attachments stored in S3-compatible object storage.

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Object Storage | MinIO (S3-compatible) |
| Auth | Basic auth (env-configured credentials, express-session) |
| Containerization | Docker Compose |

### Containers

| Container | Image/Build | Port |
|-----------|------------|------|
| `frontend` | Vite dev server | 5173 |
| `backend` | Node.js + Express | 3000 |
| `db` | postgres:16-alpine | 5432 |
| `minio` | minio/minio | 9000 (API), 9001 (Console) |

## Data Model

### Category
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK |
| name | String | Unique |
| color | String | Hex color code |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Transaction
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK |
| description | String | Required |
| amount | Decimal | Required, positive |
| type | Enum | INCOME or EXPENSE |
| date | DateTime | Required |
| categoryId | UUID | FK -> Category |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Budget
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK |
| categoryId | UUID | FK -> Category |
| amount | Decimal | Required, positive |
| month | Int | 1-12 |
| year | Int | Required |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |
| | | Unique(categoryId, month, year) |

### Attachment
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK |
| transactionId | UUID | FK -> Transaction |
| fileName | String | Original filename |
| fileKey | String | MinIO object key |
| fileSize | Int | Bytes |
| mimeType | String | e.g. image/png |
| createdAt | DateTime | Auto |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/logout` | Destroy session |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| GET | `/api/categories/:id` | Get a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category |

### Transactions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List transactions (filters: category, month, year) |
| POST | `/api/transactions` | Create a transaction |
| GET | `/api/transactions/:id` | Get a transaction (includes attachments) |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

### Budgets
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/budgets` | List budgets (filter: month, year) |
| POST | `/api/budgets` | Create a budget |
| GET | `/api/budgets/:id` | Get a budget |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/budgets/summary` | Budget vs spent per category (query: month, year) |

### Attachments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transactions/:id/attachments` | Upload attachment (multipart) |
| GET | `/api/attachments/:id` | Get attachment metadata |
| GET | `/api/attachments/:id/download` | Get presigned download URL |
| DELETE | `/api/attachments/:id` | Delete attachment |

## Authentication

- Single user, credentials via environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- `express-session` with cookie-based sessions
- Session secret via `SESSION_SECRET` env var
- Middleware protects all `/api/*` routes except `/api/auth/login`
- Frontend redirects to login page when unauthenticated

## UI Pages

### 1. Login
- Username/password form
- Redirects to dashboard on success

### 2. Dashboard
- Monthly summary cards: total income, total expenses, net balance
- Budget progress bars per category
- Over-budget categories highlighted in red with alert indicators
- Month/year selector

### 3. Transactions
- Filterable/sortable table (category, date range, type)
- Create/edit transaction modal with form validation
- File upload for attachments (drag & drop)
- View/download attached files

### 4. Categories
- List view with color indicators
- Create/edit/delete with confirmation dialog

### 5. Budgets
- Monthly budget table per category
- Set/edit budget amounts
- Visual spending progress bar per category

## Docker Setup

- `docker-compose.yml` orchestrates all 4 services
- Frontend: Vite dev server with API proxy to backend
- Backend: `tsx watch` for hot-reload in development
- PostgreSQL: named volume for data persistence
- MinIO: named volume for attachment persistence
- `.env` file for all configuration

### Environment Variables
```
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/expense_tracker

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments

# Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=change-me-in-production

# App
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

## Agent Team Strategy

5 parallel agents for implementation:

| Agent | Scope | Key Deliverables |
|-------|-------|-----------------|
| Infrastructure | Docker, env, project scaffolding | docker-compose.yml, Dockerfiles, package.json, tsconfig, .env |
| Database & API | Prisma schema, Express CRUD routes | Schema, migrations, route handlers, validation |
| Auth | Session auth, login endpoint, middleware | Auth routes, session config, auth middleware |
| Frontend Core | React app, routing, pages, components | App scaffold, all pages, forms, tables, dashboard |
| Attachments | MinIO client, upload/download, UI component | MinIO service, attachment routes, upload widget |

### Dependency Order
1. **Infrastructure** runs first (scaffolding)
2. **Database & API** + **Auth** + **Attachments (backend)** run in parallel after Infrastructure
3. **Frontend Core** + **Attachments (UI)** run after API contracts are defined
