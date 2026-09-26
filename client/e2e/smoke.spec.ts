import { expect, test } from "./fixtures"

test("an admin reaches the dashboard after signing in", async ({ as }) => {
  const page = await as("admin")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
})

test("a shared contact is listed", async ({ as }) => {
  const page = await as("admin")
  await page.goto("/contacts")
  await expect(page.getByText("E2E Shared Contact")).toBeVisible()
})

test("bad credentials are rejected", async ({ page }) => {
  await page.goto("/login")
  await page.getByPlaceholder("you@company.com").fill("e2e-admin@test.local")
  await page.getByPlaceholder("••••••••").fill("WrongPassword123!")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/login/)
})

test("an unauthenticated visitor is sent to login", async ({ page }) => {
  await page.goto("/contacts")
  await expect(page).toHaveURL(/\/login/)
})
