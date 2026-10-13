import request from 'supertest'
import { afterAll, expect } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'

export { prisma }

export const http = () => request(app)

export const bearer = (token: string) => `Bearer ${token}`

const RUN = Date.now().toString(36)
let counter = 0

export const uniqueEmail = (prefix = 'user') => `${prefix}-${RUN}-${counter++}@example.com`

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: `-${RUN}-` } } })
})

export function refreshCookie(res: { headers: Record<string, unknown> }) {
  const header = res.headers['set-cookie'] as string[] | undefined
  const raw = header?.find((cookie) => cookie.startsWith('refresh_token='))
  return raw ? raw.split(';')[0] : ''
}

export type TestUser = { id: string; email: string; token: string; cookie: string }

export async function createUser(name = 'Test User'): Promise<TestUser> {
  const email = uniqueEmail()
  const res = await http().post('/api/auth/register').send({ name, email, password: 'Test@1234' })
  expect(res.status).toBe(201)
  return { id: res.body.user.id, email, token: res.body.accessToken, cookie: refreshCookie(res) }
}

export async function categoryId(user: TestUser, name: string) {
  const res = await http().get('/api/categories').set('Authorization', bearer(user.token))
  const found = (res.body as { id: string; name: string }[]).find((category) => category.name === name)
  if (!found) throw new Error(`Category not found: ${name}`)
  return found.id
}

export async function addTransaction(user: TestUser, body: Record<string, unknown>) {
  const res = await http().post('/api/transactions').set('Authorization', bearer(user.token)).send(body)
  expect(res.status).toBe(201)
  return res.body as { id: string; amount: string }
}
