import path from "node:path"
import "dotenv/config"
import { defineConfig } from "vitest/config"

/**
 * Tests run against a `crm_test` schema in the same Postgres instance as dev.
 * Isolating by schema (rather than by database) keeps setup to zero — no extra
 * container, no second connection string to maintain — while guaranteeing the
 * suite can never touch the `crm` schema holding real data.
 */
export const TEST_SCHEMA = "crm_test"

const baseUrl = process.env.DATABASE_URL
if (!baseUrl) {
  throw new Error("DATABASE_URL must be set (see server/.env) to run tests")
}

export const BASE_DATABASE_URL = baseUrl

/**
 * The Prisma CLI selects a schema with its own `?schema=` parameter; it rejects
 * libpq's `options=-c search_path=…`. The runtime takes the opposite route via
 * PG_OPTIONS, because it connects through the pg driver adapter rather than
 * Prisma's own connector.
 */
export const prismaCliUrl = (schema: string) => {
  const url = new URL(baseUrl)
  url.searchParams.set("schema", schema)
  return url.toString()
}

const pgOptions = `-c search_path=${TEST_SCHEMA}`

// Belt and braces: the suite drops and recreates its schema, so a misconfigured
// search_path would wipe development data.
if (!pgOptions.includes(TEST_SCHEMA) || TEST_SCHEMA === "crm") {
  throw new Error(`Refusing to run: tests are not pinned to ${TEST_SCHEMA}`)
}

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    // The API talks to one Postgres schema, so parallel files would race on
    // shared rows. Cheap to serialise at this suite size.
    fileParallelism: false,
    // bcrypt dominates: each actor costs a hash plus a compare.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: baseUrl,
      // THIS is what routes the ORM. Prisma's query compiler qualifies every
      // table with the adapter's schema, so search_path alone does not isolate
      // the suite — without this, tests write into the `crm` dev schema.
      PRISMA_SCHEMA: TEST_SCHEMA,
      // Covers raw SQL, which honours search_path rather than the adapter.
      PG_OPTIONS: pgOptions,
      JWT_ACCESS_SECRET: "test-access-secret-that-is-long-enough-32",
      JWT_REFRESH_SECRET: "test-refresh-secret-that-is-long-enough-32",
      CLIENT_ORIGIN: "http://localhost:5173",
      CRON_SECRET: "test-cron-secret",
      // Minimum the env schema allows; keeps the suite fast.
      BCRYPT_ROUNDS: "10",
    },
  },
})
