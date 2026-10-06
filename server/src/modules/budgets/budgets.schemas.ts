import { z } from 'zod'
import { positiveMoney } from '../../utils/zodMoney'

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')

export const monthQuerySchema = z.object({ month })

export const saveBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month,
  amount: positiveMoney,
})

export const copyBudgetsSchema = z
  .object({ from: month, to: month })
  .refine((b) => b.from !== b.to, { message: 'Choose two different months', path: ['to'] })

export type MonthQuery = z.infer<typeof monthQuerySchema>
export type SaveBudgetInput = z.infer<typeof saveBudgetSchema>
export type CopyBudgetsInput = z.infer<typeof copyBudgetsSchema>