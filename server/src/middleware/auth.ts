import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from '../utils/AppError'

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required')
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as jwt.JwtPayload
    req.user = { id: payload.sub as string }
  } catch {
    throw new AppError(401, 'Invalid or expired token')
  }
  next()
}