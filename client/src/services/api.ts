import type { AuthResponse } from '../types/auth'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

let accessToken: string | null = null
let refreshing: Promise<AuthResponse | null> | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export class ApiError extends Error {
  status: number
  details?: { field: string; message: string }[]

  constructor(status: number, message: string, details?: { field: string; message: string }[]) {
    super(message)
    this.status = status
    this.details = details
  }
}

function send(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' })
}

export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('/auth/refresh', { method: 'POST' })
      if (!res.ok) {
        accessToken = null
        return null
      }
      const data = (await res.json()) as AuthResponse
      accessToken = data.accessToken
      return data
    } catch {
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await send(path, init)

  if (res.status === 401 && !path.startsWith('/auth/')) {
    const session = await refreshSession()
    if (session) res = await send(path, init)
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? 'Request failed', body?.details)
  }
  return body as T
}