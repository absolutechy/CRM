import { createApp } from "@/app"
import { env } from "@/config/env"
import { logger } from "@/lib/logger"
import { checkDatabase, disconnectPrisma } from "@/lib/prisma"
import { startAutomationScheduler } from "@/automations/scheduler"

const app = createApp()

const server = app.listen(env.PORT, async () => {
  logger.info(`API listening on http://localhost:${env.PORT}`)

  // Report connectivity at boot rather than letting the first request discover it.
  const database = await checkDatabase()
  if (database.ok) {
    logger.info(`Database connected (${database.latencyMs}ms)`)
  } else {
    logger.warn(
      "Database unreachable — the API is up but every data route will fail",
      { error: database.error }
    )
  }

  // Start the in-process automation worker (event rules fire on demand via the
  // engine; this cron handles time-based triggers like "inactive for N days").
  startAutomationScheduler()
})

/** Finish in-flight requests and close the pool before exiting. */
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`)
  server.close(async () => {
    await disconnectPrisma()
    process.exit(0)
  })
  // Don't hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
