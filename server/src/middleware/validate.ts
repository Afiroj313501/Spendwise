import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/AppError'

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new AppError(
        400,
        'Validation failed',
        result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      )
    }
    req.body = result.data
    next()
  }