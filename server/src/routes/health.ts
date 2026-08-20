import { Router } from "express"

import { env, hasMailConfig, hasStorageConfig } from "@/config/env"
import { checkDatabase } from "@/lib/prisma"

export const healthRouter: Router = Router()

/**
 * Reports what is actually reachable rather than a blanket "ok". Returns 503
 * when the database is down so a load balancer can act on it, while still
 * describing which subsystems are configured.
 */
healthRouter.get("/", async (_req, res) => {
  const database = await checkDatabase()

  const body = {
    status: database.ok ? "ok" : "degraded",
    env: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      database: database.ok
        ? { status: "up", latencyMs: database.latencyMs }
        : { status: "down", error: database.error },
      storage: hasStorageConfig
        ? { status: "configured" }
        : { status: "not-configured" },
      email: hasMailConfig
        ? { status: "configured" }
        : { status: "not-configured" },
    },
  }

  res.status(database.ok ? 200 : 503).json({
    success: database.ok,
    data: body,
    message: database.ok
      ? "All systems operational"
      : "Database unreachable — see checks.database.error",
  })
})
