# Expense Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack expense tracker CRUD app with Docker containerization, React TypeScript frontend, Express backend, PostgreSQL, and MinIO attachment storage.

**Architecture:** Four Docker containers (frontend, backend, db, minio) orchestrated via Docker Compose. Express REST API with Prisma ORM serves a React+TypeScript SPA. Basic auth protects all routes. Attachments stored in MinIO with presigned URLs for download.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Node.js, Express, Prisma, PostgreSQL 16, MinIO, Docker Compose

**Design Doc:** `docs/plans/2026-03-06-expense-tracker-design.md`

---

## Phase 1: Infrastructure (Agent: Infrastructure)

This phase creates the entire project scaffolding. All other phases depend on this completing first.

### Task 1: Create project root files

**Files:**
- Create: `.env`
- Create: `.gitignore`
- Create: `.dockerignore`

**Step 1: Create `.env`**

```env
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
SESSION_SECRET=super-secret-session-key-change-in-prod

# App
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

**Step 2: Create `.gitignore`**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Step 3: Create `.dockerignore`**

```
node_modules
dist
.git
.env
*.log
```

**Step 4: Commit**

```bash
git add .env .gitignore .dockerignore
git commit -m "feat: add project root config files"
```

---

### Task 2: Scaffold backend project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts` (placeholder)

**Step 1: Create `backend/package.json`**

```json
{
  "name": "expense-tracker-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.4.1",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "minio": "^8.0.5",
    "multer": "^1.4.5-lts.2",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/express-session": "^1.18.1",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.13.10",
    "@types/uuid": "^10.0.0",
    "prisma": "^6.4.1",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

**Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create `backend/src/index.ts`** (minimal placeholder)

```typescript
import express from 'express';

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

**Step 4: Install dependencies**

```bash
cd backend && npm install
```

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend project with Express + TypeScript"
```

---

### Task 3: Scaffold frontend project

**Files:**
- Create: `frontend/` (via Vite scaffold)

**Step 1: Create Vite React TypeScript project**

```bash
cd frontend-parent-dir
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

**Step 2: Install Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Update `src/index.css`:

```css
@import "tailwindcss";
```

**Step 3: Install additional dependencies**

```bash
npm install react-router-dom axios lucide-react clsx tailwind-merge class-variance-authority
npm install -D @types/react-router-dom
```

**Step 4: Add path alias to `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Add to `vite.config.ts` resolve:

```typescript
import path from 'path';

export default defineConfig({
  // ... existing config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 5: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables yes.

Add core components:

```bash
npx shadcn@latest add button card dialog input label table select badge progress alert separator dropdown-menu toast
```

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend with React, TypeScript, Tailwind, shadcn/ui"
```

---

### Task 4: Create Docker configuration

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `docker-compose.yml`

**Step 1: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**Step 2: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

**Step 3: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: expense_tracker
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/expense_tracker
      MINIO_ENDPOINT: minio
      MINIO_PORT: "9000"
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      MINIO_BUCKET: attachments
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: admin123
      SESSION_SECRET: super-secret-session-key-change-in-prod
      BACKEND_PORT: "3000"
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    depends_on:
      - backend

volumes:
  pgdata:
  miniodata:
```

**Step 4: Verify Docker Compose is valid**

```bash
docker compose config
```

**Step 5: Commit**

```bash
git add backend/Dockerfile frontend/Dockerfile docker-compose.yml
git commit -m "feat: add Docker configuration with Compose orchestration"
```

---

## Phase 2: Database, API, Auth, & Attachments Backend (Parallel Agents)

These tasks run in parallel after Phase 1 completes.

### Task 5: Prisma schema and migrations (Agent: Database & API)

**Files:**
- Create: `backend/prisma/schema.prisma`

**Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TransactionType {
  INCOME
  EXPENSE
}

model Category {
  id           String        @id @default(uuid())
  name         String        @unique
  color        String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
  budgets      Budget[]
}

model Transaction {
  id          String          @id @default(uuid())
  description String
  amount      Decimal
  type        TransactionType
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  attachments Attachment[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Budget {
  id         String   @id @default(uuid())
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  amount     Decimal
  month      Int
  year       Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([categoryId, month, year])
}

model Attachment {
  id            String      @id @default(uuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  fileName      String
  fileKey       String
  fileSize      Int
  mimeType      String
  createdAt     DateTime    @default(now())
}
```

**Step 2: Generate Prisma client and run migration**

```bash
cd backend
npx prisma migrate dev --name init
```

**Step 3: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add Prisma schema with all models and initial migration"
```

---

### Task 6: Express app setup with middleware (Agent: Database & API)

**Files:**
- Modify: `backend/src/index.ts`
- Create: `backend/src/lib/prisma.ts`

**Step 1: Create Prisma client singleton at `backend/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

**Step 2: Update `backend/src/index.ts`** with full Express setup

```typescript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { authRouter } from './routes/auth';
import { categoryRouter } from './routes/categories';
import { transactionRouter } from './routes/transactions';
import { budgetRouter } from './routes/budgets';
import { attachmentRouter } from './routes/attachments';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (no auth middleware)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/categories', authMiddleware, categoryRouter);
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/budgets', authMiddleware, budgetRouter);
app.use('/api/attachments', authMiddleware, attachmentRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

**Step 3: Commit**

```bash
git add backend/src/
git commit -m "feat: set up Express app with middleware and route structure"
```

---

### Task 7: Auth middleware and routes (Agent: Auth)

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`

**Step 1: Create auth middleware at `backend/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    username: string;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}
```

**Step 2: Create auth routes at `backend/src/routes/auth.ts`**

```typescript
import { Router, Request, Response } from 'express';

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ message: 'Login successful', username });
    return;
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

authRouter.get('/me', (req: Request, res: Response): void => {
  if (req.session?.authenticated) {
    res.json({ authenticated: true, username: req.session.username });
    return;
  }
  res.status(401).json({ authenticated: false });
});
```

**Step 3: Commit**

```bash
git add backend/src/middleware/ backend/src/routes/auth.ts
git commit -m "feat: add session-based auth middleware and login/logout routes"
```

---

### Task 8: Category CRUD routes (Agent: Database & API)

**Files:**
- Create: `backend/src/routes/categories.ts`

**Step 1: Create `backend/src/routes/categories.ts`**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const categoryRouter = Router();

// List all
categoryRouter.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

// Get one
categoryRouter.get('/:id', async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json(category);
});

// Create
categoryRouter.post('/', async (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name || !color) { res.status(400).json({ error: 'name and color are required' }); return; }
  const category = await prisma.category.create({ data: { name, color } });
  res.status(201).json(category);
});

// Update
categoryRouter.put('/:id', async (req: Request, res: Response) => {
  const { name, color } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(color && { color }) },
  });
  res.json(category);
});

// Delete
categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
```

**Step 2: Commit**

```bash
git add backend/src/routes/categories.ts
git commit -m "feat: add category CRUD routes"
```

---

### Task 9: Transaction CRUD routes (Agent: Database & API)

**Files:**
- Create: `backend/src/routes/transactions.ts`

**Step 1: Create `backend/src/routes/transactions.ts`**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const transactionRouter = Router();

// List with filters
transactionRouter.get('/', async (req: Request, res: Response) => {
  const { categoryId, month, year, type } = req.query;
  const where: any = {};

  if (categoryId) where.categoryId = categoryId as string;
  if (type) where.type = type as string;
  if (month && year) {
    const m = parseInt(month as string);
    const y = parseInt(year as string);
    where.date = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, attachments: true },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

// Get one
transactionRouter.get('/:id', async (req: Request, res: Response) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: { category: true, attachments: true },
  });
  if (!transaction) { res.status(404).json({ error: 'Transaction not found' }); return; }
  res.json(transaction);
});

// Create
transactionRouter.post('/', async (req: Request, res: Response) => {
  const { description, amount, type, date, categoryId } = req.body;
  if (!description || !amount || !type || !date || !categoryId) {
    res.status(400).json({ error: 'All fields are required' }); return;
  }
  const transaction = await prisma.transaction.create({
    data: { description, amount, type, date: new Date(date), categoryId },
    include: { category: true },
  });
  res.status(201).json(transaction);
});

// Update
transactionRouter.put('/:id', async (req: Request, res: Response) => {
  const { description, amount, type, date, categoryId } = req.body;
  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: {
      ...(description && { description }),
      ...(amount && { amount }),
      ...(type && { type }),
      ...(date && { date: new Date(date) }),
      ...(categoryId && { categoryId }),
    },
    include: { category: true },
  });
  res.json(transaction);
});

// Delete
transactionRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
```

**Step 2: Commit**

```bash
git add backend/src/routes/transactions.ts
git commit -m "feat: add transaction CRUD routes with filtering"
```

---

### Task 10: Budget CRUD routes with summary (Agent: Database & API)

**Files:**
- Create: `backend/src/routes/budgets.ts`

**Step 1: Create `backend/src/routes/budgets.ts`**

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const budgetRouter = Router();

// Budget summary - must be before /:id to avoid conflict
budgetRouter.get('/summary', async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  if (!month || !year) { res.status(400).json({ error: 'month and year are required' }); return; }

  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { category: true },
  });

  const summary = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        _sum: { amount: true },
      });

      return {
        id: budget.id,
        category: budget.category,
        budgetAmount: budget.amount,
        spentAmount: spent._sum.amount || 0,
        isOverBudget: Number(spent._sum.amount || 0) > Number(budget.amount),
      };
    })
  );

  res.json(summary);
});

// List budgets
budgetRouter.get('/', async (req: Request, res: Response) => {
  const { month, year } = req.query;
  const where: any = {};
  if (month) where.month = parseInt(month as string);
  if (year) where.year = parseInt(year as string);

  const budgets = await prisma.budget.findMany({
    where,
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  });
  res.json(budgets);
});

// Get one
budgetRouter.get('/:id', async (req: Request, res: Response) => {
  const budget = await prisma.budget.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!budget) { res.status(404).json({ error: 'Budget not found' }); return; }
  res.json(budget);
});

// Create
budgetRouter.post('/', async (req: Request, res: Response) => {
  const { categoryId, amount, month, year } = req.body;
  if (!categoryId || !amount || !month || !year) {
    res.status(400).json({ error: 'All fields are required' }); return;
  }
  const budget = await prisma.budget.create({
    data: { categoryId, amount, month, year },
    include: { category: true },
  });
  res.status(201).json(budget);
});

// Update
budgetRouter.put('/:id', async (req: Request, res: Response) => {
  const { amount, month, year } = req.body;
  const budget = await prisma.budget.update({
    where: { id: req.params.id },
    data: {
      ...(amount && { amount }),
      ...(month && { month }),
      ...(year && { year }),
    },
    include: { category: true },
  });
  res.json(budget);
});

// Delete
budgetRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.budget.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
```

**Step 2: Commit**

```bash
git add backend/src/routes/budgets.ts
git commit -m "feat: add budget CRUD routes with spending summary"
```

---

### Task 11: MinIO client and attachment routes (Agent: Attachments)

**Files:**
- Create: `backend/src/lib/minio.ts`
- Create: `backend/src/routes/attachments.ts`

**Step 1: Create MinIO client at `backend/src/lib/minio.ts`**

```typescript
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET = process.env.MINIO_BUCKET || 'attachments';

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
  }
}

export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  await minioClient.putObject(BUCKET, key, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
}

export async function getPresignedUrl(key: string): Promise<string> {
  return minioClient.presignedGetObject(BUCKET, key, 60 * 60); // 1 hour
}

export async function deleteFile(key: string): Promise<void> {
  await minioClient.removeObject(BUCKET, key);
}

export { minioClient, BUCKET };
```

**Step 2: Create attachment routes at `backend/src/routes/attachments.ts`**

```typescript
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { ensureBucket, uploadFile, getPresignedUrl, deleteFile } from '../lib/minio';

export const attachmentRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Upload attachment to a transaction
attachmentRouter.post(
  '/transactions/:transactionId/attachments',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const { transactionId } = req.params;
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) { res.status(404).json({ error: 'Transaction not found' }); return; }

    await ensureBucket();

    const fileKey = `${transactionId}/${uuidv4()}-${req.file.originalname}`;
    await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    const attachment = await prisma.attachment.create({
      data: {
        transactionId,
        fileName: req.file.originalname,
        fileKey,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json(attachment);
  }
);

// Get attachment metadata
attachmentRouter.get('/:id', async (req: Request, res: Response) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  res.json(attachment);
});

// Get presigned download URL
attachmentRouter.get('/:id/download', async (req: Request, res: Response) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  const url = await getPresignedUrl(attachment.fileKey);
  res.json({ url });
});

// Delete attachment
attachmentRouter.delete('/:id', async (req: Request, res: Response) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return; }
  await deleteFile(attachment.fileKey);
  await prisma.attachment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
```

**Step 3: Update `backend/src/index.ts`** — the attachment upload route is nested under transactions, so mount it before the authMiddleware-protected `/api/attachments`:

Add this line after the auth middleware setup:

```typescript
app.use('/api', authMiddleware, attachmentRouter);
```

The attachmentRouter handles both `/transactions/:id/attachments` and `/:id` (download/delete) paths. Update the router setup in index.ts accordingly:

```typescript
// Protected routes
app.use('/api/categories', authMiddleware, categoryRouter);
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/budgets', authMiddleware, budgetRouter);
app.use('/api', authMiddleware, attachmentRouter); // handles /api/transactions/:id/attachments and /api/attachments/:id
```

Remove the separate `/api/attachments` mount.

**Step 4: Commit**

```bash
git add backend/src/lib/minio.ts backend/src/routes/attachments.ts backend/src/index.ts
git commit -m "feat: add MinIO attachment upload/download/delete with presigned URLs"
```

---

## Phase 3: Frontend (Agent: Frontend Core + Attachments UI)

### Task 12: API client and auth context

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/context/AuthContext.tsx`

**Step 1: Create API client at `frontend/src/lib/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Step 2: Create auth context at `frontend/src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setIsAuthenticated(true);
        setUsername(res.data.username);
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    setIsAuthenticated(true);
    setUsername(res.data.username);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Step 3: Commit**

```bash
git add frontend/src/lib/ frontend/src/context/
git commit -m "feat: add API client with auth interceptor and AuthContext"
```

---

### Task 13: App routing and layout

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/main.tsx`

**Step 1: Create Layout component at `frontend/src/components/Layout.tsx`**

Sidebar navigation with links to Dashboard, Transactions, Categories, Budgets. Shows username and logout button. Uses shadcn/ui Button and lucide-react icons.

**Step 2: Create LoginPage at `frontend/src/pages/LoginPage.tsx`**

Simple centered card with username/password inputs and login button. Uses useAuth() hook. Redirects to `/` on success.

**Step 3: Update App.tsx with routes**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add app routing, layout, and login page"
```

---

### Task 14: Dashboard page

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`

**Implementation:**
- Month/year selector at top
- Three summary cards: Total Income (green), Total Expenses (red), Net Balance
- Budget progress section: fetches `/api/budgets/summary?month=&year=`, renders progress bars per category
- Over-budget items highlighted in red with alert badge
- Uses shadcn/ui Card, Progress, Badge, Alert, Select

**Commit:**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: add dashboard with budget progress and over-budget alerts"
```

---

### Task 15: Categories page

**Files:**
- Create: `frontend/src/pages/CategoriesPage.tsx`

**Implementation:**
- Table listing all categories with color swatch
- "Add Category" button opens Dialog with name + color picker inputs
- Edit button on each row opens same dialog pre-filled
- Delete button with confirmation dialog
- Full CRUD via `/api/categories`
- Uses shadcn/ui Table, Dialog, Input, Button, Label

**Commit:**

```bash
git add frontend/src/pages/CategoriesPage.tsx
git commit -m "feat: add categories page with CRUD"
```

---

### Task 16: Transactions page

**Files:**
- Create: `frontend/src/pages/TransactionsPage.tsx`

**Implementation:**
- Table with columns: Date, Description, Category, Type, Amount, Attachments count, Actions
- Filter bar: category dropdown, type dropdown, month/year selectors
- "Add Transaction" button opens Dialog with form (description, amount, type select, date picker, category select)
- Edit/Delete actions per row
- Attachment section in the edit dialog: list existing, upload new, delete
- Uses shadcn/ui Table, Dialog, Input, Select, Button, Badge

**Commit:**

```bash
git add frontend/src/pages/TransactionsPage.tsx
git commit -m "feat: add transactions page with filters, CRUD, and attachment management"
```

---

### Task 17: Budgets page

**Files:**
- Create: `frontend/src/pages/BudgetsPage.tsx`

**Implementation:**
- Month/year selector at top
- Table: Category name, Budget Amount, Spent Amount, Progress bar, Status badge
- "Set Budget" button opens Dialog: select category, enter amount
- Edit/Delete per row
- Progress bar colored green (under 80%), yellow (80-100%), red (over 100%)
- Uses shadcn/ui Table, Dialog, Input, Select, Progress, Badge

**Commit:**

```bash
git add frontend/src/pages/BudgetsPage.tsx
git commit -m "feat: add budgets page with spending progress visualization"
```

---

### Task 18: Seed data script

**Files:**
- Create: `backend/prisma/seed.ts`

**Step 1: Create seed script** with sample categories (Food, Transport, Entertainment, Utilities, Shopping), sample transactions, and sample budgets.

**Step 2: Add seed config to `backend/package.json`**

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Step 3: Run seed**

```bash
cd backend && npx prisma db seed
```

**Step 4: Commit**

```bash
git add backend/prisma/seed.ts backend/package.json
git commit -m "feat: add seed data with sample categories, transactions, and budgets"
```

---

### Task 19: Final integration and Docker verification

**Step 1: Build and start all containers**

```bash
docker compose up --build
```

**Step 2: Run database migration inside container**

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

**Step 3: Verify endpoints**

```bash
# Login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'

# Categories
curl -b cookies.txt http://localhost:3000/api/categories

# Budget summary
curl -b cookies.txt "http://localhost:3000/api/budgets/summary?month=3&year=2026"
```

**Step 4: Open browser at http://localhost:5173 and verify:**
- Login page appears
- Login with admin/admin123
- Dashboard shows summary and budget progress
- All CRUD pages work
- File upload works on transactions

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete expense tracker with Docker, full CRUD, and attachment support"
```

---

## Agent Assignment Summary

| Agent | Tasks | Phase |
|-------|-------|-------|
| Infrastructure | 1, 2, 3, 4 | Phase 1 (sequential) |
| Database & API | 5, 6, 8, 9, 10 | Phase 2 (parallel) |
| Auth | 7 | Phase 2 (parallel) |
| Attachments | 11 | Phase 2 (parallel) |
| Frontend Core | 12, 13, 14, 15, 16, 17 | Phase 3 (parallel after Phase 2) |
| Integration | 18, 19 | Phase 4 (final) |

## Dependency Graph

```
Phase 1: [Task 1] → [Task 2] → [Task 3] → [Task 4]
                                                |
Phase 2: [Task 5] → [Task 6] → [Task 8] → [Task 9] → [Task 10]  (parallel with below)
         [Task 7]                                                   (parallel)
         [Task 11]                                                  (parallel)
                                                |
Phase 3: [Task 12] → [Task 13] → [Task 14, 15, 16, 17]  (pages in parallel)
                                                |
Phase 4: [Task 18] → [Task 19]
```
