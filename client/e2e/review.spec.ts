import { expect, test } from "./fixtures"

/**
 * The queue is seeded by server/scripts/setup-e2e.ts, so nothing here calls
 * Claude. What is being tested is the review and approval experience, not
 * extraction quality.
 */

test("a rep sees the pending batch with a readable diff", async ({ as }) => {
  const page = await as("repA")
  await page.goto("/review")

  await expect(page.getByText("E2E Call Notes")).toBeVisible()
  await expect(page.getByText("Job title")).toBeVisible()
  // The diff shows the proposed value, not just a description of it.
  await expect(page.getByText("Head of Platform")).toBeVisible()
})

test("evidence is collapsed until asked for", async ({ as }) => {
  const page = await as("repA")
  await page.goto("/review")

  await expect(page.getByText("he runs the platform team")).toHaveCount(0)
  await page.getByRole("button", { name: "Evidence" }).first().click()
  await expect(page.getByText("he runs the platform team")).toBeVisible()
})

test("a rep cannot approve the shared contact change", async ({ as }) => {
  const page = await as("repA")
  await page.goto("/review")

  // Two changes in the batch: the lead one is approvable, the contact one is not.
  const rows = page.locator("li", { has: page.getByRole("button", { name: "Approve" }) })
  await expect(rows).toHaveCount(2)

  const contactRow = page.locator("li").filter({ hasText: "Phone" })
  await expect(contactRow.getByRole("button", { name: "Approve" })).toBeDisabled()
})

test("an admin can approve the contact change", async ({ as }) => {
  const page = await as("admin")
  await page.goto("/review")

  const contactRow = page.locator("li").filter({ hasText: "Phone" })
  await expect(contactRow.getByRole("button", { name: "Approve" })).toBeEnabled()
})

test("approving a change removes it from the queue", async ({ as }) => {
  const page = await as("repA")
  await page.goto("/review")

  const leadRow = page.locator("li").filter({ hasText: "Job title" })
  await leadRow.getByRole("button", { name: "Approve" }).click()

  await expect(page.getByText("Change applied")).toBeVisible({ timeout: 15_000 })
})

test("an empty queue explains what to do", async ({ as }) => {
  const page = await as("repB")
  await page.goto("/review")
  // repB owns no extractions, so the queue is empty for them.
  await expect(page.getByText("Nothing to review")).toBeVisible()
})
