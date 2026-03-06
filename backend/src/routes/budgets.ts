import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const budgetRouter = Router();

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

budgetRouter.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!budget) { res.status(404).json({ error: 'Budget not found' }); return; }
  res.json(budget);
});

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

budgetRouter.put('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { amount, month, year } = req.body;
  const budget = await prisma.budget.update({
    where: { id },
    data: {
      ...(amount && { amount }),
      ...(month && { month }),
      ...(year && { year }),
    },
    include: { category: true },
  });
  res.json(budget);
});

budgetRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.budget.delete({ where: { id } });
  res.status(204).send();
});
