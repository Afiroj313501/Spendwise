import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

const server = app.listen(env.PORT, () => {
  console.log(`SpendWise API running on port ${env.PORT} (${env.NODE_ENV})`)
})

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`)
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined)
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
