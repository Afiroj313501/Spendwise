import { z } from 'zod'

const money = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), 'Amount must be a number with up to 2 decimal places')

export const positiveMoney = money.refine((v) => Number(v) > 0, 'Amount must be greater than zero')
export const nonNegativeMoney = money