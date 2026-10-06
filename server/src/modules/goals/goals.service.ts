import type { Prisma, SavingsGoal } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { fromDbDate, toDbDate } from '../../utils/dates'
import type { CreateGoalInput, FundsInput, UpdateGoalInput } from './goals.schemas'

function toDto(g: SavingsGoal) {
  return {
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount.toFixed(2),
    savedAmount: g.savedAmount.toFixed(2),
    percent: g.savedAmount.div(g.targetAmount).times(100).toFixed(1), // can exceed 100
    deadline: g.deadline ? fromDbDate(g.deadline) : null,
    completed: g.savedAmount.gte(g.targetAmount),
  }
}

export async function list(userId: string) {
  const goals = await prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  return goals.map(toDto)
}

export async function getOne(userId: string, id: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } })
  if (!goal) throw new AppError(404, 'Goal not found')
  return toDto(goal)
}

export async function create(userId: string, input: CreateGoalInput) {
  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      name: input.name,
      targetAmount: input.targetAmount,
      savedAmount: input.savedAmount ?? '0',
      deadline: input.deadline ? toDbDate(input.deadline) : null,
    },
  })
  return toDto(goal)
}

export async function update(userId: string, id: string, input: UpdateGoalInput) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) throw new AppError(404, 'Goal not found')

  const data: Prisma.SavingsGoalUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.targetAmount !== undefined) data.targetAmount = input.targetAmount
  if (input.deadline !== undefined) data.deadline = input.deadline ? toDbDate(input.deadline) : null

  return toDto(await prisma.savingsGoal.update({ where: { id }, data }))
}

// One atomic statement, so two quick clicks can never push savings below zero
export async function changeFunds(userId: string, id: string, input: FundsInput) {
  const withdraw = input.action === 'withdraw'

  const { count } = await prisma.savingsGoal.updateMany({
    where: withdraw ? { id, userId, savedAmount: { gte: input.amount } } : { id, userId },
    data: { savedAmount: withdraw ? { decrement: input.amount } : { increment: input.amount } },
  })

  if (count === 0) {
    const exists = await prisma.savingsGoal.findFirst({ where: { id, userId }, select: { id: true } })
    throw exists
      ? new AppError(400, 'You cannot withdraw more than the saved amount')
      : new AppError(404, 'Goal not found')
  }
  return getOne(userId, id)
}

export async function remove(userId: string, id: string) {
  const { count } = await prisma.savingsGoal.deleteMany({ where: { id, userId } })
  if (count === 0) throw new AppError(404, 'Goal not found')
}