import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.attachment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const food = await prisma.category.create({
    data: { name: 'Food & Dining', color: '#ef4444' },
  });
  const transport = await prisma.category.create({
    data: { name: 'Transportation', color: '#3b82f6' },
  });
  const entertainment = await prisma.category.create({
    data: { name: 'Entertainment', color: '#8b5cf6' },
  });
  const utilities = await prisma.category.create({
    data: { name: 'Utilities', color: '#f59e0b' },
  });
  const shopping = await prisma.category.create({
    data: { name: 'Shopping', color: '#10b981' },
  });
  const salary = await prisma.category.create({
    data: { name: 'Salary', color: '#06b6d4' },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Create transactions for current month
  const transactions = [
    { description: 'Grocery shopping', amount: 85.50, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 2), categoryId: food.id },
    { description: 'Restaurant dinner', amount: 45.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 5), categoryId: food.id },
    { description: 'Coffee shop', amount: 12.75, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 7), categoryId: food.id },
    { description: 'Uber ride', amount: 22.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 3), categoryId: transport.id },
    { description: 'Gas station', amount: 55.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 10), categoryId: transport.id },
    { description: 'Movie tickets', amount: 30.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 8), categoryId: entertainment.id },
    { description: 'Streaming subscription', amount: 15.99, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 1), categoryId: entertainment.id },
    { description: 'Electric bill', amount: 120.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 5), categoryId: utilities.id },
    { description: 'Internet bill', amount: 65.00, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 5), categoryId: utilities.id },
    { description: 'New headphones', amount: 79.99, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth - 1, 12), categoryId: shopping.id },
    { description: 'Monthly salary', amount: 5000.00, type: TransactionType.INCOME, date: new Date(currentYear, currentMonth - 1, 1), categoryId: salary.id },
    { description: 'Freelance project', amount: 750.00, type: TransactionType.INCOME, date: new Date(currentYear, currentMonth - 1, 15), categoryId: salary.id },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx });
  }

  // Create budgets for current month
  const budgets = [
    { categoryId: food.id, amount: 200, month: currentMonth, year: currentYear },
    { categoryId: transport.id, amount: 100, month: currentMonth, year: currentYear },
    { categoryId: entertainment.id, amount: 50, month: currentMonth, year: currentYear },
    { categoryId: utilities.id, amount: 200, month: currentMonth, year: currentYear },
    { categoryId: shopping.id, amount: 150, month: currentMonth, year: currentYear },
  ];

  for (const budget of budgets) {
    await prisma.budget.create({ data: budget });
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
