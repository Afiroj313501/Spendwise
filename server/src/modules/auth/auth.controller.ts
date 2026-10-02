import type { Response } from 'express'
import { env } from '../../config/env'
import { asyncHandler } from '../../utils/AsyncHandler'
import * as authService from './auth.service'

const REFRESH_COOKIE = 'refresh_token'
const isProd = env.NODE_ENV === 'production'

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/auth',
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  })
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body)
  setRefreshCookie(res, refreshToken)
  res.status(201).json({ user, accessToken })
})

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body)
  setRefreshCookie(res, refreshToken)
  res.json({ user, accessToken })
})

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE])
  setRefreshCookie(res, refreshToken)
  res.json({ user, accessToken })
})

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE])
  res.clearCookie(REFRESH_COOKIE, cookieOptions)
  res.status(204).send()
})

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getUser(req.user!.id)
  res.json({ user })
})