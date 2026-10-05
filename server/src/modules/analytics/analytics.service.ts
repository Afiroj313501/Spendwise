import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { shiftMonth, toDbDate } from '../../utils/dates'

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

// Income and expense totals for each of the last `count` months, oldest first
export async function getCashflow(userId: string, month: string, count: number) {
  const first = shiftMonth(month, -(count - 1))
  const from = `${first}-01`
  const to = `${shiftMonth(month, 1)}-01`

  const rows = await prisma.$queryRaw<{ month: string; type: string; total: Prisma.Decimal }[]>`
    SELECT to_char("date", 'YYYY-MM') AS month, "type"::text AS type, SUM("amount") AS total
    FROM "Transaction"
    WHERE "userId" = ${userId} AND "date" >= ${from}::date AND "date" < ${to}::date
    GROUP BY 1, 2
  `

  const totals = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>()
  for (const r of rows) {
    const entry = totals.get(r.month) ?? { income: ZERO, expense: ZERO }
    const value = new Prisma.Decimal(r.total)
    if (r.type === 'INCOME') entry.income = value
    else entry.expense = value
    totals.set(r.month, entry)
  }

  // Months with no transactions still appear, as zero
  const points = Array.from({ length: count }, (_, i) => {
    const m = shiftMonth(first, i)
    const t = totals.get(m)
    return {
      month: m,
      income: (t?.income ?? ZERO).toFixed(2),
      expense: (t?.expense ?? ZERO).toFixed(2),
    }
  })

  return { month, points }
}

// Spending by category for one month: top 4 plus "Other"
export async function getBreakdown(userId: string, month: string) {
  const start = toDbDate(`${month}-01`)
  const next = toDbDate(`${shiftMonth(month, 1)}-01`)

  const rows = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: start, lt: next } },
    _sum: { amount: true },
  })

  const ids = rows.map((r) => r.categoryId).filter((id): id is string => id !== null)
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, name: true },
  })
  const names = new Map(categories.map((c) => [c.id, c.name]))

  const items = rows
    .map((r) => ({
      name: r.categoryId ? (names.get(r.categoryId) ?? 'Uncategorized') : 'Uncategorized',
      amount: r._sum.amount ?? ZERO,
    }))
    .filter((i) => i.amount.gt(0))
    .sort((a, b) => b.amount.comparedTo(a.amount))

  const total = items.reduce((sum, i) => sum.plus(i.amount), ZERO)

  const TOP = 4
  const shown = items.slice(0, TOP)
  const rest = items.slice(TOP)
  if (rest.length > 0) {
    shown.push({ name: 'Other', amount: rest.reduce((sum, i) => sum.plus(i.amount), ZERO) })
  }

  return {
    month,
    total: total.toFixed(2),
    items: shown.map((i) => ({
      name: i.name,
      amount: i.amount.toFixed(2),
      percent: total.isZero() ? '0.0' : i.amount.div(total).times(100).toFixed(1),
    })),
  }
}