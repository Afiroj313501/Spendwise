import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40),
  type: z.enum(['INCOME', 'EXPENSE']),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>