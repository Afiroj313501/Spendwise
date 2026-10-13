import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { bearer, createUser, http, prisma, refreshCookie, uniqueEmail } from '../helpers'

const PASSWORD = 'Secret123'

describe('POST /api/auth/register', () => {
  it('creates an account, default categories and an httpOnly refresh cookie', async () => {
    const email = uniqueEmail('Ada')
    const res = await http().post('/api/auth/register').send({ name: 'Ada', email, password: PASSWORD })

    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ name: 'Ada', email: email.toLowerCase(), currency: 'BDT' })
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(typeof res.body.accessToken).toBe('string')

    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.find((cookie) => cookie.startsWith('refresh_token='))).toContain('HttpOnly')
    expect(await prisma.category.count({ where: { userId: res.body.user.id } })).toBe(10)
  })

  it('never stores the plain password', async () => {
    const email = uniqueEmail('ada')
    await http().post('/api/auth/register').send({ name: 'Ada', email, password: PASSWORD })
    const user = await prisma.user.findUniqueOrThrow({ where: { email } })
    expect(user.passwordHash).not.toContain(PASSWORD)
    expect(user.passwordHash.startsWith('$2')).toBe(true)
  })

  it('rejects a duplicate email, ignoring letter case', async () => {
    const email = uniqueEmail('ada')
    await http().post('/api/auth/register').send({ name: 'Ada', email, password: PASSWORD })
    const res = await http()
      .post('/api/auth/register')
      .send({ name: 'Ada 2', email: email.toUpperCase(), password: PASSWORD })
    expect(res.status).toBe(409)
  })

  it.each([
    ['a password with no number', { password: 'onlyletters' }, 'password'],
    ['a password with no letter', { password: '12345678' }, 'password'],
    ['a password that is too short', { password: 'Ab1' }, 'password'],
    ['an invalid email', { email: 'not-an-email' }, 'email'],
    ['a too-short name', { name: 'A' }, 'name'],
  ])('rejects %s with a field-level error', async (_label, override, field) => {
    const email = uniqueEmail('invalid')
    const res = await http()
      .post('/api/auth/register')
      .send({ name: 'Ada', email, password: PASSWORD, ...override })
    expect(res.status).toBe(400)
    expect(res.body.details.map((detail: { field: string }) => detail.field)).toContain(field)
    const used = (override as { email?: string }).email ?? email
    expect(await prisma.user.count({ where: { email: used } })).toBe(0)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with the right credentials', async () => {
    const user = await createUser()
    const res = await http().post('/api/auth/login').send({ email: user.email, password: 'Test@1234' })
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
    expect(refreshCookie(res)).not.toBe('')
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const user = await createUser()
    const wrong = await http().post('/api/auth/login').send({ email: user.email, password: 'Wrong@1234' })
    const unknown = await http().post('/api/auth/login').send({ email: uniqueEmail('nobody'), password: 'Test@1234' })

    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.message).toBe(unknown.body.message)
  })
})

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    expect((await http().get('/api/auth/me')).status).toBe(401)
  })

  it('rejects a garbage token and an expired token', async () => {
    const user = await createUser()
    expect((await http().get('/api/auth/me').set('Authorization', bearer('garbage'))).status).toBe(401)

    const expired = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -10 })
    expect((await http().get('/api/auth/me').set('Authorization', bearer(expired))).status).toBe(401)
  })

  it('returns the logged-in user', async () => {
    const user = await createUser()
    const res = await http().get('/api/auth/me').set('Authorization', bearer(user.token))
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(user.email)
  })
})

describe('refresh tokens', () => {
  it('rotate on use: an old token cannot be used twice', async () => {
    const user = await createUser()
    const first = await http().post('/api/auth/refresh').set('Cookie', user.cookie)
    expect(first.status).toBe(200)
    const newCookie = refreshCookie(first)
    expect(newCookie).not.toBe('')
    expect(newCookie).not.toBe(user.cookie)

    expect((await http().post('/api/auth/refresh').set('Cookie', user.cookie)).status).toBe(401)
    expect((await http().post('/api/auth/refresh').set('Cookie', newCookie)).status).toBe(200)
  })

  it('are stored only as a hash', async () => {
    const user = await createUser()
    const raw = user.cookie.split('=')[1]
    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0].tokenHash).not.toBe(raw)
  })

  it('are rejected without a cookie', async () => {
    expect((await http().post('/api/auth/refresh')).status).toBe(401)
  })

  it('are rejected, and removed, once expired', async () => {
    const user = await createUser()
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    expect((await http().post('/api/auth/refresh').set('Cookie', user.cookie)).status).toBe(401)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
  })
})

describe('POST /api/auth/logout', () => {
  it('invalidates the refresh token', async () => {
    const user = await createUser()
    const out = await http().post('/api/auth/logout').set('Cookie', user.cookie)
    expect(out.status).toBe(204)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
    expect((await http().post('/api/auth/refresh').set('Cookie', user.cookie)).status).toBe(401)
  })
})
