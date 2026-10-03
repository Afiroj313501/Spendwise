import { Prisma } from '@prisma/client'
import type { TransactionType } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { fromDbDate, toDbDate } from '../../utils/dates'
import type { CreateTransactionInput, ListQuery, UpdateTransactionInput } from './transactions.schemas'

const include = {
  category: { select: { id: true, name: true, type: true } },
} satisfies Prisma.TransactionInclude

type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof include }>

// Amounts leave the API as exact decimal strings, dates as YYYY-MM-DD
function toDto(t: TransactionRow) {
  return {
    id: t.id,
    amount: t.amount.toFixed(2),
    type: t.type,
    date: fromDbDate(t.date),
    description: t.description,
    category: t.category,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

async function assertCategory(userId: string, categoryId: string, type: TransactionType) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!category) throw new AppError(400, 'Category not found')
  if (category.type !== type) {
    throw new AppError(400, `This category is for ${category.type.toLowerCase()} transactions`)
  }
}

export async function list(userId: string, q: ListQuery) {
  const where: Prisma.TransactionWhereInput = { userId }
  if (q.type) where.type = q.type
  if (q.categoryId) where.categoryId = q.categoryId
  if (q.from || q.to) {
    where.date = {}
    if (q.from) where.date.gte = toDbDate(q.from)
    if (q.to) where.date.lte = toDbDate(q.to)
  }
  if (q.search) {
    where.OR = [
      { description: { contains: q.search, mode: 'insensitive' } },
      { category: { name: { contains: q.search, mode: 'insensitive' } } },
    ]
  }

  const primary: Prisma.TransactionOrderByWithRelationInput =
    q.sortBy === 'amount' ? { amount: q.order }
    : q.sortBy === 'createdAt' ? { createdAt: q.order }
    : { date: q.order }

  const [items, total, grouped] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include,
      orderBy: [primary, { id: 'asc' }], // id keeps pagination stable when values tie
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } }),
  ])

  const sum = (type: TransactionType) =>
    (grouped.find((g) => g.type === type)?._sum.amount ?? new Prisma.Decimal(0)).toFixed(2)
  const income = sum('INCOME')
  const expense = sum('EXPENSE')

  return {
    data: items.map(toDto),
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
    summary: {
      income,
      expense,
      net: new Prisma.Decimal(income).minus(expense).toFixed(2),
    },
  }
}

export async function getOne(userId: string, id: string) {
  const row = await prisma.transaction.findFirst({ where: { id, userId }, include })
  if (!row) throw new AppError(404, 'Transaction not found')
  return toDto(row)
}

export async function create(userId: string, input: CreateTransactionInput) {
  if (input.categoryId) await assertCategory(userId, input.categoryId, input.type)

  const row = await prisma.transaction.create({
    data: {
      userId,
      amount: input.amount,
      type: input.type,
      date: toDbDate(input.date),
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
    },
    include,
  })
  return toDto(row)
}

export async function update(userId: string, id: string, input: UpdateTransactionInput) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) throw new AppError(404, 'Transaction not found')

  // The final type and category must still match after the update
  const type = input.type ?? existing.type
  const categoryId = input.categoryId === undefined ? existing.categoryId : input.categoryId
  if (categoryId && (input.type !== undefined || input.categoryId !== undefined)) {
    await assertCategory(userId, categoryId, type)
  }

  const data: Prisma.TransactionUncheckedUpdateInput = {}
  if (input.amount !== undefined) data.amount = input.amount
  if (input.type !== undefined) data.type = input.type
  if (input.date !== undefined) data.date = toDbDate(input.date)
  if (input.description !== undefined) data.description = input.description
  if (input.categoryId !== undefined) data.categoryId = input.categoryId

  const row = await prisma.transaction.update({ where: { id }, data, include })
  return toDto(row)
}

export async function remove(userId: string, id: string) {
  const { count } = await prisma.transaction.deleteMany({ where: { id, userId } })
  if (count === 0) throw new AppError(404, 'Transaction not found')
}