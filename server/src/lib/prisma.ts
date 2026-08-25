import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

import { env, isDev } from "@/config/env"
import { logger } from "./logger"

/**
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 * The pool lives here so the whole app shares one. The `crm` schema is set via
 * the pg pool's search_path — the adapter's `schema` option only reports
 * metadata and does not qualify generated queries.
 */
export const PRISMA_SCHEMA = "crm"

const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    // pg startup options: route unqualified table names to the crm schema.
    options: "-c search_path=crm",
    max: 10,
  },
  {
    // Reported as metadata to Prisma; the actual routing is via search_path.
    schema: PRISMA_SCHEMA,
  }
)

export const prisma = new PrismaClient({
  adapter,
  log: isDev ? ["warn", "error"] : ["error"],
})

/**
 * Cheap liveness probe for the health endpoint. Returns the failure rather
 * than throwing, so `/health` can report "degraded" instead of 500-ing.
 */
export const checkDatabase = async (): Promise<{
  ok: boolean
  latencyMs?: number
  error?: string
}> => {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - started }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "unknown error",
    }
  }
}

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    logger.warn("Prisma disconnect failed", { error })
  }
}
