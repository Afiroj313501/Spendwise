import { PrismaClient } from '@prisma/client'
import { env } from './env'

const databaseUrl = new URL(env.DATABASE_URL)
databaseUrl.searchParams.set('pgbouncer', 'true')

export const prisma = new PrismaClient({
	datasourceUrl: databaseUrl.toString(),
})