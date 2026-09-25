import type { CookieOptions, Request, Response } from "express"

import { env, isProd } from "@/config/env"
import { created, noContent, ok } from "@/lib/http"
import {
  getMe,
  login as loginUser,
  logout as logoutUser,
  refresh as refreshSession,
  register as registerUser,
} from "@/services/authService"

const REFRESH_COOKIE = env.AUTH_COOKIE_NAME

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  // Cross-site deploys (frontend on Vercel, API elsewhere) need SameSite=None
  // + Secure; same-site deploys keep lax.
  sameSite: env.AUTH_COOKIE_SAMESITE,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, aligned with JWT_REFRESH_TTL
})

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions())
}

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
}

const readRefreshCookie = (req: Request): string | undefined =>
  (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]

/** Admin-only user creation. */
export const register = async (req: Request, res: Response) => {
  const { user } = await registerUser(req.body)
  created(res, { user }, "User created")
}

export const login = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body)
  setRefreshCookie(res, refreshToken)
  ok(res, { user, accessToken }, "Logged in")
}

export const refresh = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await refreshSession(
    readRefreshCookie(req)
  )
  setRefreshCookie(res, refreshToken)
  ok(res, { user, accessToken }, "Token refreshed")
}

export const logout = async (req: Request, res: Response) => {
  await logoutUser(readRefreshCookie(req))
  clearRefreshCookie(res)
  noContent(res)
}

export const me = async (req: Request, res: Response) => {
  const { user } = await getMe(req.user!.id)
  ok(res, { user }, "OK")
}
