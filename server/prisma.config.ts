import "dotenv/config"
import { defineConfig, env } from "prisma/config"

/**
 * Prisma 7 moved the connection URL out of schema.prisma and into this file.
 * The runtime client gets its connection separately, through a driver adapter
 * (see src/lib/prisma.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
})
