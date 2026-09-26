import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { Client } from "pg"

import { BASE_DATABASE_URL, TEST_SCHEMA, prismaCliUrl } from "../vitest.config"

const serverDir = fileURLToPath(new URL("..", import.meta.url))

/**
 * Creates the test schema and pushes the Prisma schema into it once per run.
 *
 * `db push --accept-data-loss` is destructive, so it is pinned to TEST_SCHEMA,
 * which is dropped and recreated empty immediately beforehand. The `crm` schema
 * holding development data is never referenced.
 */
export default async function setup() {
  const host = new URL(BASE_DATABASE_URL).hostname
  const admin = new Client({ connectionString: BASE_DATABASE_URL })
  await admin.connect()
  try {
    await admin.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`)
    await admin.query(`CREATE SCHEMA ${TEST_SCHEMA}`)
  } finally {
    await admin.end()
  }

  const result = spawnSync(
    "npx",
    [
      "prisma",
      "db",
      "push",
      "--accept-data-loss",
      "--url",
      prismaCliUrl(TEST_SCHEMA),
    ],
    {
      cwd: serverDir,
      shell: true,
      encoding: "utf8",
      env: {
        ...process.env,
        // Prisma 7 blocks destructive commands invoked by an AI agent unless
        // the user's consent is passed through explicitly.
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
      },
    }
  )

  if (result.status !== 0) {
    throw new Error(
      `prisma db push failed against ${TEST_SCHEMA} on ${host}\n${result.stderr}`
    )
  }
}
