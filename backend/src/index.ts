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
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use('/api/categories', authMiddleware, categoryRouter);
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/budgets', authMiddleware, budgetRouter);
app.use('/api', authMiddleware, attachmentRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
