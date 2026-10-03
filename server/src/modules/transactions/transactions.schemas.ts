import { z } from 'zod'
import { isRealDate } from '../../utils/dates'

const typeEnum = z.enum(['INCOME', 'EXPENSE'])
const isoDate = z.string().refine(isRealDate, 'Date must be a real date in YYYY-MM-DD format')

// Money is validated as text so it never passes through a floating-point number
const amount = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), 'Amount must be a number with up to 2 decimal places')
  .refine((v) => Number(v) > 0, 'Amount must be greater than zero')

export const createTransactionSchema = z.object({
  amount,
  type: typeEnum,
  date: isoDate,
  description: z.string().trim().max(200).transform((v) => v || null).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
})

export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')

export const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: typeEnum.optional(),
    categoryId: z.string().uuid().optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must not be after "to"',
    path: ['from'],
  })

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type ListQuery = z.infer<typeof listQuerySchema>