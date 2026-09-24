import "dotenv/config"
import { defineConfig, env } from "prisma/config"

/**
 * Prisma 7 moved the connection URL out of schema.prisma and into this file.
 * The runtime client gets its connection separately, through a driver adapter
 * (see src/lib/prisma.ts).
 *
 * Note there is no `directUrl` in Prisma 7 — the URL here IS the direct one.
 * The split is: this file drives the CLI (db push, migrate, seed, studio) and
 * wants a session-mode connection that can run DDL; src/lib/prisma.ts drives
 * the serverless runtime and wants the transaction-mode pooler. So point
 * DIRECT_URL at Supabase's session pooler (port 5432) and DATABASE_URL at the
 * transaction pooler (port 6543). Without DIRECT_URL we fall back, which is
 * what a plain single-instance Postgres wants.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
})
