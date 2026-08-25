import { Router } from "express"
import type { CookieOptions, Request, Response } from "express"
import rateLimit from "express-rate-limit"

import { env, isProd } from "@/config/env"
import { created, noContent, ok } from "@/lib/http"
import { authenticate, authorize } from "@/middleware/auth"
import {
  getMe,
  login,
  logout,
  refresh,
  register,
} from "@/services/authService"

export const authRouter: Router = Router()

// Tight brute-force limiter for credential endpoints only. Other auth routes
// (me/refresh/logout) are protected by the global /api rate limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Too many authentication attempts, please try again shortly",
  },
})

const REFRESH_COOKIE = env.AUTH_COOKIE_NAME

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
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
authRouter.post(
  "/register",
  authLimiter,
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const { user } = await register(req.body)
    created(res, { user }, "User created")
  }
)

authRouter.post("/login", authLimiter, async (req, res) => {
  const { user, accessToken, refreshToken } = await login(req.body)
  setRefreshCookie(res, refreshToken)
  ok(res, { user, accessToken }, "Logged in")
})

authRouter.post("/refresh", async (req, res) => {
  const { user, accessToken, refreshToken } = await refresh(
    readRefreshCookie(req)
  )
  setRefreshCookie(res, refreshToken)
  ok(res, { user, accessToken }, "Token refreshed")
})

authRouter.post("/logout", async (req, res) => {
  await logout(readRefreshCookie(req))
  clearRefreshCookie(res)
  noContent(res)
})

authRouter.get("/me", authenticate, async (req, res) => {
  const { user } = await getMe(req.user!.id)
  ok(res, { user }, "OK")
})
