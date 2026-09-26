import {
  expect,
  test as base,
  type APIRequestContext,
  type Page,
} from "@playwright/test"

/** The fixed cast seeded by server/scripts/setup-e2e.ts. */
export const PASSWORD = "E2EPassword123!"

export const USERS = {
  admin: "e2e-admin@test.local",
  manager: "e2e-manager@test.local",
  repA: "e2e-rep-a@test.local",
  repB: "e2e-rep-b@test.local",
} as const

export type RoleKey = keyof typeof USERS

/**
 * Signs in through the UI, every time.
 *
 * Playwright's usual trick is to authenticate once and replay `storageState`,
 * but this API rotates refresh tokens and treats reuse of a rotated one as
 * theft — it revokes the user's whole session family (see
 * server/src/lib/refreshToken.ts). Replaying a saved cookie would therefore
 * fail from the second test onward and log the user out everywhere. Logging in
 * per test costs about a second and matches what a real user does.
 */
export const loginAs = async (page: Page, role: RoleKey) => {
  await page.goto("/login")
  await page.getByPlaceholder("you@company.com").fill(USERS[role])
  await page.getByPlaceholder("••••••••").fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/localhost:5174\/($|dashboard)/, {
    timeout: 20_000,
  })
}

/**
 * An authenticated API client for a role.
 *
 * The app keeps its access token in Redux memory, not in a cookie, so
 * `page.request` inherits the session cookie but no Authorization header and
 * every call comes back 401. This logs in over HTTP and attaches the bearer
 * token explicitly. It is a separate token family from the browser session, so
 * the two never invalidate each other under refresh rotation.
 */
export const apiAs = async (request: APIRequestContext, role: RoleKey) => {
  const res = await request.post("/api/auth/login", {
    data: { email: USERS[role], password: PASSWORD },
  })
  if (!res.ok()) {
    throw new Error(`API login failed for ${role}: ${res.status()}`)
  }
  const token = (await res.json()).data.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }

  return {
    token,
    get: (url: string) => request.get(url, { headers }),
    post: (url: string, data?: unknown) => request.post(url, { headers, data }),
    patch: (url: string, data?: unknown) => request.patch(url, { headers, data }),
    delete: (url: string) => request.delete(url, { headers }),
  }
}

/** `test` with an `as` helper: `await as("repA")` returns a signed-in page. */
export const test = base.extend<{ as: (role: RoleKey) => Promise<Page> }>({
  as: async ({ page }, use) => {
    await use(async (role: RoleKey) => {
      await loginAs(page, role)
      return page
    })
  },
})

export { expect }
