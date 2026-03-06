# Expense Tracker

A full-stack expense tracking application with transaction management, category organization, monthly budgets with over-budget alerts, and receipt/invoice attachments.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL 16
- **Object Storage:** MinIO (S3-compatible, for attachments)
- **Containerization:** Docker Compose

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/averliz/expense-tracker-fri-diy-demo.git
cd expense-tracker-fri-diy-demo
```

### 2. Create environment file

```bash
cp .env.example .env
```

Or create `.env` manually:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/expense_tracker
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=super-secret-session-key-change-in-prod
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

### 3. Start the application

```bash
docker compose up --build -d
```

### 4. Run database migration and seed

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

### 5. Open the app

- **App:** http://localhost:5173
- **Login:** `admin` / `admin123`
- **MinIO Console:** http://localhost:9001 (login: `minioadmin` / `minioadmin`)

## Stopping the app

```bash
docker compose down
```

To also remove database and storage volumes:

```bash
docker compose down -v
```

## Project Structure

```
.
├── backend/
│   ├── prisma/          # Schema, migrations, seed
│   ├── src/
│   │   ├── lib/         # Prisma client, MinIO client
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/      # API route handlers
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Layout, shadcn/ui components
│   │   ├── context/     # Auth context
│   │   ├── lib/         # API client, utilities
│   │   └── pages/       # Dashboard, Transactions, Categories, Budgets, Login
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env
```

## API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Categories | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id` |
| Transactions | `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id` |
| Budgets | `GET/POST /api/budgets`, `GET/PUT/DELETE /api/budgets/:id`, `GET /api/budgets/summary` |
| Attachments | `POST /api/transactions/:id/attachments`, `GET/DELETE /api/attachments/:id`, `GET /api/attachments/:id/download` |
