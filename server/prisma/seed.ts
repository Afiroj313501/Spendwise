import { PrismaClient, TransactionType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Deterministic pseudo-random generator so the demo data is reproducible
let state = 42
const rand = () => {
  state = (state * 16807) % 2147483647
  return (state - 1) / 2147483646
}
const between = (min: number, max: number) =>
  (Math.round((min + rand() * (max - min)) * 100) / 100).toFixed(2)

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transport', 'Rent', 'Utilities',
  'Shopping', 'Entertainment', 'Health', 'Education',
]
const INCOME_CATEGORIES = ['Salary', 'Freelance']

async function main() {
  await prisma.user.deleteMany({ where: { email: 'demo@spendwise.app' } })

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@spendwise.app',
      passwordHash: await hash('Demo@1234', 12),
    },
  })

  const cats: Record<string, string> = {}
  for (const name of EXPENSE_CATEGORIES) {
    const c = await prisma.category.create({
      data: { userId: user.id, name, type: TransactionType.EXPENSE },
    })
    cats[name] = c.id
  }
  for (const name of INCOME_CATEGORIES) {
    const c = await prisma.category.create({
      data: { userId: user.id, name, type: TransactionType.INCOME },
    })
    cats[name] = c.id
  }

  const now = new Date()
  const rows: {
    userId: string; categoryId: string; amount: string
    type: TransactionType; date: Date; description: string
  }[] = []

  const add = (
    cat: string, type: TransactionType, y: number, m: number,
    day: number, min: number, max: number, description: string,
  ) => {
    const date = new Date(Date.UTC(y, m, day))
    if (date > now) return // no future-dated demo data
    rows.push({
      userId: user.id, categoryId: cats[cat], amount: between(min, max),
      type, date, description,
    })
  }

  const budgetRows: { userId: string; categoryId: string; amount: string; month: Date }[] = []

  for (let offset = 0; offset < 6; offset++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth()

    add('Salary', 'INCOME', y, m, 1, 55000, 55000, 'Monthly salary')
    if (offset > 0) add('Freelance', 'INCOME', y, m, 20, 5000, 15000, 'Freelance project')
    add('Rent', 'EXPENSE', y, m, 3, 15000, 15000, 'House rent')
    add('Utilities', 'EXPENSE', y, m, 10, 2500, 3500, 'Electricity & internet')
    for (let i = 0; i < 8; i++)
      add('Food & Dining', 'EXPENSE', y, m, 2 + i * 3, 150, 900, 'Meals & groceries')
    for (let i = 0; i < 6; i++)
      add('Transport', 'EXPENSE', y, m, 2 + i * 4, 50, 400, 'Ride & fuel')
    add('Shopping', 'EXPENSE', y, m, 8, 800, 4000, 'Clothes')
    add('Shopping', 'EXPENSE', y, m, 22, 800, 3000, 'Online order')
    add('Entertainment', 'EXPENSE', y, m, 14, 300, 1500, 'Movie & outing')
    add('Health', 'EXPENSE', y, m, 17, 300, 2000, 'Pharmacy')

    const budgets: Record<string, string> = {
      'Food & Dining': '8000.00', Transport: '2500.00', Shopping: '5000.00',
      Entertainment: '2000.00', Rent: '15000.00',
    }
    for (const [name, amount] of Object.entries(budgets))
      budgetRows.push({ userId: user.id, categoryId: cats[name], amount, month: d })
  }

  await prisma.transaction.createMany({
    data: rows.map((r) => ({ ...r, type: r.type as TransactionType })),
  })
  await prisma.budget.createMany({ data: budgetRows })

  console.log(`Seeded ${rows.length} transactions and ${budgetRows.length} budgets`)
  console.log('Login: demo@spendwise.app / Demo@1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())