import { z } from 'zod'
import { isRealDate } from '../../utils/dates'
import { nonNegativeMoney, positiveMoney } from '../../utils/zodMoney'

const isoDate = z.string().refine(isRealDate, 'Date must be a real date in YYYY-MM-DD format')
const name = z.string().trim().min(1, 'Name is required').max(60)

export const createGoalSchema = z.object({
  name,
  targetAmount: positiveMoney,
  savedAmount: nonNegativeMoney.optional(),
  deadline: isoDate.nullable().optional(),
})

export const updateGoalSchema = z
  .object({
    name: name.optional(),
    targetAmount: positiveMoney.optional(),
    deadline: isoDate.nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update')

export const fundsSchema = z.object({
  amount: positiveMoney,
  action: z.enum(['add', 'withdraw']),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type FundsInput = z.infer<typeof fundsSchema>