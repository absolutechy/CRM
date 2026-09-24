import { createApp } from "../dist/app.js"

// Vercel serverless entry. @vercel/node TRANSPILES this file, it does not
// bundle it — so the import must be something plain Node ESM can resolve at
// runtime. src/ is not: it uses `@/*` aliases and extensionless specifiers.
// `npm run build` (tsc + tsc-alias + scripts/fix-esm-imports.mjs) turns those
// into relative paths with .js extensions under dist/, which is why the build
// command runs it before the function is compiled.
//
// The node-cron scheduler is intentionally not started here; the Vercel cron
// calls POST /api/automations/run instead.
const app = createApp()

export default app
