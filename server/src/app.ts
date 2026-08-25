import express, { type Express } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"

import { env, isDev } from "@/config/env"
import { logger } from "@/lib/logger"
import { errorHandler, notFoundHandler } from "@/middleware/error"
import { authRouter } from "@/routes/auth"
import { healthRouter } from "@/routes/health"
import { leadsRouter } from "@/routes/leads"
import { contactsRouter } from "@/routes/contacts"
import { companiesRouter } from "@/routes/companies"
import { dealsRouter } from "@/routes/deals"
import { activitiesRouter } from "@/routes/activities"
import { tasksRouter } from "@/routes/tasks"
import { documentsRouter } from "@/routes/documents"
import { usersRouter } from "@/routes/users"
import { campaignsRouter } from "@/routes/campaigns"
import { emailTemplatesRouter } from "@/routes/emailTemplates"
import { emailsRouter } from "@/routes/emails"
import { automationsRouter } from "@/routes/automations"
import { notificationsRouter } from "@/routes/notifications"

export const createApp = (): Express => {
  const app = express()

  // Behind a proxy in production, so rate limiting sees the real client IP.
  app.set("trust proxy", 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      // Refresh tokens travel in an httpOnly cookie.
      credentials: true,
    })
  )
  app.use(express.json({ limit: "1mb" }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use(
    morgan(isDev ? "dev" : "combined", {
      stream: { write: (line) => logger.http?.(line.trim()) ?? logger.info(line.trim()) },
    })
  )

  // Generous global ceiling; auth routes get a much tighter one of their own.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        message: "Too many requests, please try again shortly",
      },
    })
  )

  app.use("/api/health", healthRouter)
  app.use("/api/auth", authRouter)
  app.use("/api/leads", leadsRouter)
  app.use("/api/contacts", contactsRouter)
  app.use("/api/companies", companiesRouter)
  app.use("/api/deals", dealsRouter)
  app.use("/api/activities", activitiesRouter)
  app.use("/api/tasks", tasksRouter)
  app.use("/api/documents", documentsRouter)
  app.use("/api/users", usersRouter)
  app.use("/api/campaigns", campaignsRouter)
  app.use("/api/email-templates", emailTemplatesRouter)
  app.use("/api/emails", emailsRouter)
  app.use("/api/automations", automationsRouter)
  app.use("/api/notifications", notificationsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
