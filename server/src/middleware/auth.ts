import type { NextFunction, Request, Response } from "express"
import type { UserRole } from "@prisma/client"

import { ApiError } from "@/lib/http"
import { verifyAccessToken } from "@/lib/jwt"
import { prisma } from "@/lib/prisma"

/**
 * Verifies the Bearer access token and loads the user fresh from the DB, so
 * deactivated accounts and role changes take effect immediately rather than
 * at token expiry. Attaches `req.user = { id, role }`.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined

  if (!token) {
    next(ApiError.unauthorized())
    return
  }

  const payload = await verifyAccessToken(token)
  if (!payload) {
    next(ApiError.unauthorized())
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, isActive: true },
  })

  if (!user || !user.isActive) {
    next(ApiError.unauthorized("Account is disabled"))
    return
  }

  req.user = { id: user.id, role: user.role }
  next()
}

/** Requires one of the given roles. Must run after `authenticate`. */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(ApiError.forbidden())
      return
    }
    next()
  }
}
