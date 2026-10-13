import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

const base = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
}

const MINUTES = 60 * 1000

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTES,
  limit: 600,
  message: { message: 'Too many requests, please slow down' },
})

export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts, please try again later' },
})

export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * MINUTES,
  limit: 20,
  message: { message: 'Too many sign-ups from this network, please try again later' },
})

export const refreshLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTES,
  limit: 100,
  message: { message: 'Too many requests, please try again later' },
})

export const exportLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTES,
  limit: 20,
  message: { message: 'Too many exports, please try again later' },
})
