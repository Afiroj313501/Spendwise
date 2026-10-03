import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { prisma } from './config/prisma'
import authRoutes from './modules/auth/auth.routes'
import { errorHandler, notFound } from './middleware/errorHandler'
import categoryRoutes from './modules/categories/categories.routes'
import transactionRoutes from './modules/transactions/transactions.routes'

const app = express()

app.set('trust proxy', 1) // needed behind Render's proxy for rate limiting and secure cookies
app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json())
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

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)

app.use(notFound)
app.use(errorHandler)

export default app