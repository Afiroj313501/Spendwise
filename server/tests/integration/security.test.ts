import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { bearer, createUser, http, uniqueEmail } from '../helpers'

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

describe('response headers', () => {
  it('sends hardening headers and does not reveal the framework', async () => {
    const res = await http().get('/api/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeDefined()
  })

  it('forbids caching of API responses', async () => {
    const res = await http().get('/api/health')
    expect(res.headers['cache-control']).toBe('no-store')
  })
})

describe('cross-site request protection', () => {
  it('rejects a state-changing request from an unknown origin', async () => {
    const res = await http().post('/api/auth/logout').set('Origin', 'https://evil.example')
    expect(res.status).toBe(403)
  })

  it('allows the configured front-end origin', async () => {
    const res = await http().post('/api/auth/logout').set('Origin', 'http://localhost:5173')
    expect(res.status).toBe(204)
  })

  it('gives an unknown origin no CORS permission on a safe request', async () => {
    const res = await http().get('/api/health').set('Origin', 'https://evil.example')
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('request handling', () => {
  it('answers malformed JSON with 400 instead of 500', async () => {
    const res = await http().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ')
    expect(res.status).toBe(400)
  })

  it('rejects an oversized body with 413', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ name: 'x'.repeat(100_000), email: uniqueEmail('big'), password: 'Secret123' })
    expect(res.status).toBe(413)
  })

  it('never exposes stack traces or file paths in errors', async () => {
    const res = await http().get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules|\bat .*\(/i)
  })
})

describe('access tokens', () => {
  it('rejects an unsigned token', async () => {
    const user = await createUser()
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: user.id })}.`
    expect((await http().get('/api/auth/me').set('Authorization', bearer(token))).status).toBe(401)
  })

  it('rejects a token signed with a different algorithm', async () => {
    const user = await createUser()
    const token = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET!, { algorithm: 'HS512' })
    expect((await http().get('/api/auth/me').set('Authorization', bearer(token))).status).toBe(401)
  })

  it('rejects a token signed with another secret', async () => {
    const user = await createUser()
    const token = jwt.sign({ sub: user.id }, 'some-other-secret-that-is-also-long-enough-0000', { algorithm: 'HS256' })
    expect((await http().get('/api/auth/me').set('Authorization', bearer(token))).status).toBe(401)
  })

  it('accepts a correctly signed token', async () => {
    const user = await createUser()
    const token = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET!, {
      algorithm: 'HS256',
      expiresIn: 60,
    })
    expect((await http().get('/api/auth/me').set('Authorization', bearer(token))).status).toBe(200)
  })
})
