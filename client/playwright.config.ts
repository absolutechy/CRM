import { defineConfig, devices } from "@playwright/test"

/**
 * Browser tests drive the real stack: the Vite dev server proxying /api to the
 * Express API, which talks to an isolated `crm_e2e` Postgres schema. Nothing
 * here can reach the `crm` development schema — see e2e/globalSetup.ts.
 */
export const E2E_SCHEMA = "crm_e2e"
export const BASE_URL = "http://localhost:5174"
const API_PORT = 3100

export default defineConfig({
  testDir: "./e2e",
  // Roles share one database, so parallel workers would race on each other's
  // rows. The suite is small; serial keeps it honest.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  globalSetup: "./e2e/globalSetup.ts",

  use: {
    baseURL: BASE_URL,
    // Only kept for failures, so a green run leaves nothing behind.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // No storageState/setup project: the API rotates refresh tokens and revokes
  // the session family on reuse, so each test signs in for itself. See
  // e2e/fixtures.ts.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      // The API, pinned to the E2E schema on its own port so it cannot collide
      // with a dev server you already have running.
      command: "npm run dev",
      cwd: "../server",
      port: API_PORT,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "development",
        PORT: String(API_PORT),
        PRISMA_SCHEMA: E2E_SCHEMA,
        PG_OPTIONS: `-c search_path=${E2E_SCHEMA}`,
        CLIENT_ORIGIN: BASE_URL,
        JWT_ACCESS_SECRET: "e2e-access-secret-that-is-long-enough-32",
        JWT_REFRESH_SECRET: "e2e-refresh-secret-that-is-long-enough-32",
      },
    },
    {
      command: `npm run dev -- --port 5174 --strictPort`,
      port: 5174,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        // Point the Vite proxy at the E2E API rather than the default :3000.
        E2E_API_PORT: String(API_PORT),
      },
    },
  ],
})
