import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Dev traffic goes through the Vite proxy to the API, avoiding CORS and
    // matching the browser's origin (cookies with sameSite=lax just work).
    proxy: {
      "/api": {
        // E2E_API_PORT lets the Playwright suite point at its own API instance
        // (see playwright.config.ts) without disturbing normal dev on :3000.
        target: `http://localhost:${process.env.E2E_API_PORT ?? 3000}`,
        changeOrigin: true,
      },
    },
  },
})
