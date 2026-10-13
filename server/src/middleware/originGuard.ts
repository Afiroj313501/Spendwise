import type { RequestHandler } from 'express'
import { clientOrigins } from '../config/env'
import { AppError } from '../utils/AppError'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const originGuard: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin
  if (!SAFE_METHODS.has(req.method) && origin && !clientOrigins.includes(origin)) {
    throw new AppError(403, 'Origin not allowed')
  }
  next()
}
