import { spawnSync } from "node:child_process"
import path from "node:path"

import { E2E_SCHEMA } from "../playwright.config"

/**
 * Delegates all database work to the server package, which already has Prisma,
 * bcrypt and pg. Keeps the browser suite free of backend dependencies.
 */
export default async function globalSetup() {
  if (E2E_SCHEMA === "crm") {
    throw new Error("Refusing to run E2E against the `crm` development schema")
  }

  const serverDir = path.resolve(import.meta.dirname, "../../server")

  const result = spawnSync("npx", ["tsx", "scripts/setup-e2e.ts"], {
    cwd: serverDir,
    shell: true,
    encoding: "utf8",
    env: {
      ...process.env,
      PRISMA_SCHEMA: E2E_SCHEMA,
      PG_OPTIONS: `-c search_path=${E2E_SCHEMA}`,
    },
  })

  if (result.status !== 0) {
    throw new Error(
      `E2E database setup failed:\n${result.stdout}\n${result.stderr}`
    )
  }
  console.log(result.stdout.trim())
}
