import type { NextFunction, Request, Response } from "express"

import { env } from "@/config/env"
import { ApiError } from "@/lib/http"

/**
 * Guards endpoints invoked by Vercel's cron rather than by a user. Vercel
 * sends `Authorization: Bearer <CRON_SECRET>`; this sits alongside
 * `authenticate` rather than inside it because cron has no user session.
 */
export const requireCronSecret = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization ?? ""
  const secret = env.CRON_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    next(ApiError.unauthorized("Invalid cron secret"))
    return
  }

  next()
}
