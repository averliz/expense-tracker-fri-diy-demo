import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const categoryRouter = Router();

categoryRouter.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

categoryRouter.get('/:id', async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json(category);
});

categoryRouter.post('/', async (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name || !color) { res.status(400).json({ error: 'name and color are required' }); return; }
  const category = await prisma.category.create({ data: { name, color } });
  res.status(201).json(category);
});

categoryRouter.put('/:id', async (req: Request, res: Response) => {
  const { name, color } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(color && { color }) },
  });
  res.json(category);
});

categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
