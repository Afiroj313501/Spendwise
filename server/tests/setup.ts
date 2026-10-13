import dotenv from 'dotenv'
import { afterAll } from 'vitest'

dotenv.config({ path: '.env.test', override: true })

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET ??= 'test_secret_that_is_at_least_32_characters_long_0000'

const url = process.env.DATABASE_URL ?? ''
const isTestDatabase = /schema=spendwise_test|@(localhost|127\.0\.0\.1)[:/]/.test(url)
if (!isTestDatabase) {
  throw new Error(
    'Refusing to run tests: DATABASE_URL is not a test database. ' +
      'Use server/.env.test with ?schema=spendwise_test (or a local Postgres).',
  )
}

afterAll(async () => {
  const { prisma } = await import('../src/config/prisma')
  await prisma.$disconnect()
})
