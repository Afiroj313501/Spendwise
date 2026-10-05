import { z } from 'zod'

export const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
})

export const cashflowQuerySchema = summaryQuerySchema.extend({
  months: z.coerce.number().int().min(2).max(12).default(6),
})

export type CashflowQuery = z.infer<typeof cashflowQuerySchema>
export type SummaryQuery = z.infer<typeof summaryQuerySchema>