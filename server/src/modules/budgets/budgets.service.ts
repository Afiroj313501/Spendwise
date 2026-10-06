import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { shiftMonth, toDbDate } from '../../utils/dates'
import type { CopyBudgetsInput, SaveBudgetInput } from './budgets.schemas'

const ZERO = new Prisma.Decimal(0)
const monthStart = (month: string) => toDbDate(`${month}-01`)

// 80% or more is a warning; strictly above 100% is over budget
function statusOf(percent: Prisma.Decimal) {
  if (percent.gt(100)) return 'over' as const
  if (percent.gte(80)) return 'warning' as const
  return 'ok' as const
}

export async function list(userId: string, month: string) {
  const start = monthStart(month)
  const next = monthStart(shiftMonth(month, 1))

  const [budgets, spentRows] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month: start },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { category: { name: 'asc' } },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', categoryId: { not: null }, date: { gte: start, lt: next } },
      _sum: { amount: true },
    }),
  ])
  const spentBy = new Map(spentRows.map((r) => [r.categoryId as string, r._sum.amount ?? ZERO]))

  let totalBudget = ZERO
  let totalSpent = ZERO

  const items = budgets.map((b) => {
    const spent = spentBy.get(b.categoryId) ?? ZERO
    const percent = spent.div(b.amount).times(100)
    totalBudget = totalBudget.plus(b.amount)
    totalSpent = totalSpent.plus(spent)
    return {
      id: b.id,
      category: b.category,
      month,
      amount: b.amount.toFixed(2),
      spent: spent.toFixed(2),
      remaining: b.amount.minus(spent).toFixed(2), // negative when over budget
      percent: percent.toFixed(1),
      status: statusOf(percent),
    }
  })

  return {
    month,
    budgets: items,
    totals: {
      budget: totalBudget.toFixed(2),
      spent: totalSpent.toFixed(2),
      remaining: totalBudget.minus(totalSpent).toFixed(2),
      percent: totalBudget.isZero() ? '0.0' : totalSpent.div(totalBudget).times(100).toFixed(1),
    },
  }
}

// Create or update the budget for one category and month
export async function save(userId: string, input: SaveBudgetInput) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId } })
  if (!category) throw new AppError(400, 'Category not found')
  if (category.type !== 'EXPENSE') throw new AppError(400, 'Budgets can only be set for expense categories')

  const month = monthStart(input.month)
  const budget = await prisma.budget.upsert({
    where: { userId_categoryId_month: { userId, categoryId: input.categoryId, month } },
    create: { userId, categoryId: input.categoryId, month, amount: input.amount },
    update: { amount: input.amount },
  })
  return { id: budget.id }
}

export async function remove(userId: string, id: string) {
  const { count } = await prisma.budget.deleteMany({ where: { id, userId } })
  if (count === 0) throw new AppError(404, 'Budget not found')
}

// Copies budgets that don't already exist in the target month
export async function copyMonth(userId: string, input: CopyBudgetsInput) {
  const source = await prisma.budget.findMany({ where: { userId, month: monthStart(input.from) } })
  const target = monthStart(input.to)

  const { count } = await prisma.budget.createMany({
    data: source.map((b) => ({ userId, categoryId: b.categoryId, month: target, amount: b.amount })),
    skipDuplicates: true,
  })
  return { copied: count }
}