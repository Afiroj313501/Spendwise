import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { clientOrigins, env } from './config/env'
import { prisma } from './config/prisma'
import { errorHandler, notFound } from './middleware/errorHandler'
import { originGuard } from './middleware/originGuard'
import { apiLimiter } from './middleware/rateLimits'
import analyticsRoutes from './modules/analytics/analytics.routes'
import authRoutes from './modules/auth/auth.routes'
import budgetRoutes from './modules/budgets/budgets.routes'
import categoryRoutes from './modules/categories/categories.routes'
import goalRoutes from './modules/goals/goals.routes'
import transactionRoutes from './modules/transactions/transactions.routes'

const app = express()

app.set('trust proxy', env.TRUST_PROXY_HOPS)
app.use(helmet())
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || clientOrigins.includes(origin)),
    credentials: true,
    maxAge: 600,
  }),
)
app.use('/api', originGuard)
app.use(express.json({ limit: '50kb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' })
  }
})

app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
