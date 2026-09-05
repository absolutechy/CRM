import { createApp } from "../src/app"

// Vercel serverless entry. @vercel/node bundles this file (and the whole
// import graph) with esbuild, resolving the @/* aliases from tsconfig.json —
// no prebuilt dist/ needed. The node-cron scheduler is intentionally not
// started here; the Vercel cron calls POST /api/automations/run instead.
const app = createApp()

export default app
