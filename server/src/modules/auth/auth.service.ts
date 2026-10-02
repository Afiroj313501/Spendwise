import { createHash, randomBytes } from 'crypto'
import { compare, hash, hashSync } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { AppError } from '../../utils/AppError'
import type { LoginInput, RegisterInput } from './auth.schemas'

const DAY_MS = 24 * 60 * 60 * 1000
// Used so a login for an unknown email takes the same time as a real one
const DUMMY_HASH = hashSync('not-a-real-password', 12)

const publicUser = { id: true, name: true, email: true, currency: true } as const

const DEFAULT_CATEGORIES = [
  ...['Food & Dining', 'Transport', 'Rent', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Education'].map(
    (name) => ({ name, type: 'EXPENSE' as const }),
  ),
  ...['Salary', 'Freelance'].map((name) => ({ name, type: 'INCOME' as const })),
]

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  })
}

async function issueRefreshToken(userId: string) {
  const token = randomBytes(48).toString('hex')
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * DAY_MS),
    },
  })
  return token
}

async function createSession(userId: string) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: await issueRefreshToken(userId),
  }
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AppError(409, 'An account with this email already exists')

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 12),
      categories: { create: DEFAULT_CATEGORIES },
    },
    select: publicUser,
  })

  return { user, ...(await createSession(user.id)) }
}

export async function login(input: LoginInput) {
  const found = await prisma.user.findUnique({ where: { email: input.email } })
  const valid = await compare(input.password, found?.passwordHash ?? DUMMY_HASH)

  if (!found || !valid) throw new AppError(401, 'Invalid email or password')

  const user = {
    id: found.id,
    name: found.name,
    email: found.email,
    currency: found.currency,
  }
  return { user, ...(await createSession(user.id)) }
}

export async function refresh(token: string | undefined) {
  if (!token) throw new AppError(401, 'No refresh token')

  const tokenHash = sha256(token)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
    throw new AppError(401, 'Session expired, please log in again')
  }

  // Rotation: the old token is single-use
  await prisma.refreshToken.delete({ where: { id: stored.id } })

  const user = await prisma.user.findUnique({ where: { id: stored.userId }, select: publicUser })
  if (!user) throw new AppError(401, 'User no longer exists')

  return { user, ...(await createSession(user.id)) }
}

export async function logout(token: string | undefined) {
  if (!token) return
  await prisma.refreshToken.deleteMany({ where: { tokenHash: sha256(token) } })
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUser })
  if (!user) throw new AppError(404, 'User not found')
  return user
}