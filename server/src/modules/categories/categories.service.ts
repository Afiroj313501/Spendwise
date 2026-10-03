import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import type { CreateCategoryInput } from './categories.schemas'

const select = { id: true, name: true, type: true } as const

export const list = (userId: string) =>
  prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select,
  })

export async function create(userId: string, input: CreateCategoryInput) {
  const duplicate = await prisma.category.findFirst({
    where: { userId, type: input.type, name: { equals: input.name, mode: 'insensitive' } },
  })
  if (duplicate) throw new AppError(409, 'You already have a category with this name')

  return prisma.category.create({ data: { userId, ...input }, select })
}

// Transactions in the category stay but become uncategorized; its budgets are removed
export async function remove(userId: string, id: string) {
  const { count } = await prisma.category.deleteMany({ where: { id, userId } })
  if (count === 0) throw new AppError(404, 'Category not found')
}