import { createApp } from "../src/app"

// Vercel serverless entry: @vercel/node bundles this file and resolves the
// @/* aliases from tsconfig.json. The node-cron scheduler is intentionally not
// started here — serverless functions are short-lived; the Vercel cron calls
// POST /api/automations/run for time-based automation instead.
const app = createApp()

export default app
