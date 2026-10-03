import type { RequestHandler } from 'express'
import type { ZodError, ZodType } from 'zod'
import { AppError } from '../utils/AppError'

const issues = (error: ZodError) =>
  error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) throw new AppError(400, 'Validation failed', issues(result.error))
    req.body = result.data
    next()
  }

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) throw new AppError(400, 'Invalid query parameters', issues(result.error))
    res.locals.query = result.data
    next()
  }