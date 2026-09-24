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

/**
 * Startup options that pin the search_path. A shared transaction-mode pooler
 * (Supabase's port 6543) multiplexes sessions and may ignore or reject these,
 * so PG_OPTIONS="" disables them — set the search_path on the role instead:
 *
 *   ALTER ROLE postgres IN DATABASE postgres SET search_path TO crm, public;
 */
const pgOptions = process.env.PG_OPTIONS ?? `-c search_path=${PRISMA_SCHEMA}`

/**
 * One lambda instance serves few concurrent requests but many instances share
 * the pooler, so a large per-instance pool just exhausts the pooler's client
 * slots. Keep it at 1 on serverless and use a real pool when long-lived.
 */
const poolMax = process.env.VERCEL ? 1 : 10

const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    ...(pgOptions ? { options: pgOptions } : {}),
    max: poolMax,
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
