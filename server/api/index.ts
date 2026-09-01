import { createApp } from "../dist/app.js"

// Vercel serverless entry: Vercel builds the project (tsc + tsc-alias emits
// dist/), then serves this function. The node-cron scheduler is intentionally
// not started here — serverless functions are short-lived; time-based
// automation needs a long-running host.
const app = createApp()

export default app
