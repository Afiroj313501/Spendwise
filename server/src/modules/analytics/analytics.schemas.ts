import { z } from 'zod'

export const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
})

export type SummaryQuery = z.infer<typeof summaryQuerySchema>