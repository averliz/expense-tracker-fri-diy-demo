import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const transactionRouter = Router();

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

transactionRouter.get('/:id', async (req: Request, res: Response) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: { category: true, attachments: true },
  });
  if (!transaction) { res.status(404).json({ error: 'Transaction not found' }); return; }
  res.json(transaction);
});

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

transactionRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
