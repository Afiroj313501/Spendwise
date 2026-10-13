import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
    REFRESH_TOKEN_DAYS: z.coerce.number().default(7),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  })
  .superRefine((value, ctx) => {
    for (const origin of value.CLIENT_URL.split(',')) {
      try {
        new URL(origin.trim())
      } catch {
        ctx.addIssue({ code: 'custom', path: ['CLIENT_URL'], message: `Not a valid URL: ${origin}` })
      }
    }
    if (value.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
      ctx.addIssue({ code: 'custom', path: ['CLIENT_URL'], message: 'CLIENT_URL must be set in production' })
    }
  })

export const env = envSchema.parse(process.env)

export const clientOrigins = env.CLIENT_URL
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)