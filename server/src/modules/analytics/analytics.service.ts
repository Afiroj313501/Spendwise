import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'

const ZERO = new Prisma.Decimal(0)
const DAY_MS = 24 * 60 * 60 * 1000

type Insight =
  | { kind: 'category_up'; category: string; percent: string; amount: string }
  | { kind: 'spending_down'; percent: string }
  | { kind: 'no_data' }

type Window = { prevStart: Date; start: Date; next: Date; prevEnd: Date }

// Running totals of everything dated before a cutoff
async function totalsBefore(userId: string, before: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { lt: before } },
    _sum: { amount: true },
  })
  const pick = (t: 'INCOME' | 'EXPENSE') => rows.find((r) => r.type === t)?._sum.amount ?? ZERO
  return { income: pick('INCOME'), expense: pick('EXPENSE') }
}

async function expenseByCategory(userId: string, from: Date, to: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', categoryId: { not: null }, date: { gte: from, lt: to } },
    _sum: { amount: true },
  })
  return new Map(rows.map((r) => [r.categoryId as string, r._sum.amount ?? ZERO]))
}

function delta(current: Prisma.Decimal, previous: Prisma.Decimal) {
  const change = current.minus(previous)
  return {
    current: current.toFixed(2),
    previous: previous.toFixed(2),
    change: change.toFixed(2),
    percent: previous.isZero() ? null : change.div(previous.abs()).times(100).toFixed(1),
  }
}

// Simple rules, no paid AI needed. More rules can be added later.
async function buildInsight(
  userId: string,
  w: Window,
  expenseCur: Prisma.Decimal,
  expensePrev: Prisma.Decimal,
): Promise<Insight | null> {
  if (expenseCur.isZero() && expensePrev.isZero()) return { kind: 'no_data' }

  const [cur, prev] = await Promise.all([
    expenseByCategory(userId, w.start, w.next),
    expenseByCategory(userId, w.prevStart, w.prevEnd),
  ])

  let top: { id: string; diff: Prisma.Decimal; pct: Prisma.Decimal } | null = null
  for (const [id, amount] of cur) {
    const before = prev.get(id)
    if (!before || before.isZero()) continue
    const diff = amount.minus(before)
    const pct = diff.div(before).times(100)
    if (pct.gte(20) && (!top || diff.gt(top.diff))) top = { id, diff, pct }
  }

  if (top) {
    const category = await prisma.category.findFirst({
      where: { id: top.id, userId },
      select: { name: true },
    })
    if (category) {
      return {
        kind: 'category_up',
        category: category.name,
        percent: top.pct.toFixed(0),
        amount: top.diff.toFixed(2),
      }
    }
  }

  if (!expensePrev.isZero() && expenseCur.lt(expensePrev)) {
    return {
      kind: 'spending_down',
      percent: expensePrev.minus(expenseCur).div(expensePrev).times(100).toFixed(0),
    }
  }
  return null
}

export async function getSummary(userId: string, month: string) {
  const [y, m] = month.split('-').map(Number)
  const prevStart = new Date(Date.UTC(y, m - 2, 1))
  const start = new Date(Date.UTC(y, m - 1, 1))
  const next = new Date(Date.UTC(y, m, 1))

  // For the month in progress, compare against the same days of last month
  const now = new Date()
  const inProgress = now >= start && now < next
  const prevEnd = inProgress
    ? new Date(Math.min(start.getTime(), prevStart.getTime() + now.getUTCDate() * DAY_MS))
    : start

  const [atNext, atStart, atPrevStart, atPrevEnd] = await Promise.all([
    totalsBefore(userId, next),
    totalsBefore(userId, start),
    totalsBefore(userId, prevStart),
    prevEnd.getTime() === start.getTime() ? Promise.resolve(null) : totalsBefore(userId, prevEnd),
  ])
  const atPrevEndOrStart = atPrevEnd ?? atStart

  const incomeCur = atNext.income.minus(atStart.income)
  const expenseCur = atNext.expense.minus(atStart.expense)
  const incomePrev = atPrevEndOrStart.income.minus(atPrevStart.income)
  const expensePrev = atPrevEndOrStart.expense.minus(atPrevStart.expense)

  // Balance is a running total, so it compares against the end of last month
  const balanceCur = atNext.income.minus(atNext.expense)
  const balancePrev = atStart.income.minus(atStart.expense)

  return {
    month,
    partial: inProgress,
    balance: delta(balanceCur, balancePrev),
    income: delta(incomeCur, incomePrev),
    expense: delta(expenseCur, expensePrev),
    insight: await buildInsight(userId, { prevStart, start, next, prevEnd }, expenseCur, expensePrev),
  }
}