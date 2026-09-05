// Vercel serverless entry. Vercel runs `npm run build` before deploying, which
// emits dist/ with @/* aliases rewritten to relative paths by tsc-alias. The
// Express app is created once per warm instance and used as the handler.
import { createApp } from "../dist/app.js"

const app = createApp()

export default app
