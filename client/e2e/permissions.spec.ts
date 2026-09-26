import { apiAs, expect, test, loginAs } from "./fixtures"

test.describe("two users at once", () => {
  // Four sign-ins at roughly three seconds each, so the default 30s is tight.
  test.setTimeout(120_000)

  test("rep B does not see a lead owned by rep A", async ({ browser }) => {
    // Two independent contexts = two real sessions side by side. This is the
    // check that is tedious to do by hand and easy to get wrong in production.
    // One context per user: sessions must not share cookies.
    const ctxAdmin = await browser.newContext()
    const ctxRepA = await browser.newContext()
    const ctxRepB = await browser.newContext()

    try {
      const adminPage = await ctxAdmin.newPage()
      await loginAs(adminPage, "admin")

      // Create a lead assigned to rep A, straight through the API using the
      // admin's own session cookies.
      const marker = `Owned-${Date.now()}`
      const api = await apiAs(adminPage.request, "admin")
      const users = await api.get("/api/users")
      expect(users.ok()).toBeTruthy()
      const repA = (await users.json()).data.users.find(
        (u: { email: string }) => u.email === "e2e-rep-a@test.local"
      )
      expect(repA, "rep A should exist").toBeTruthy()

      const created = await api.post("/api/leads", {
        name: marker,
        email: `${marker.toLowerCase()}@test.local`,
        ownerId: repA.id,
      })
      expect(created.status(), await created.text()).toBe(201)

      // Rep B, in a separate browser session, must not see it.
      const repBPage = await ctxRepB.newPage()
      await loginAs(repBPage, "repB")
      await repBPage.goto("/leads")
      // Target the name link specifically: the seeded email also contains the
      // marker, so a plain text match hits two elements.
      await expect(
        repBPage.getByRole("link", { name: marker, exact: true })
      ).toHaveCount(0)

      // Rep A must.
      const repAPage = await ctxRepA.newPage()
      await loginAs(repAPage, "repA")
      await repAPage.goto("/leads")
      await expect(
        repAPage.getByRole("link", { name: marker, exact: true })
      ).toBeVisible()
    } finally {
      await ctxAdmin.close()
      await ctxRepA.close()
      await ctxRepB.close()
    }
  })
})

test.describe("the API enforces role gates the UI calls into", () => {
  test("a rep is refused when creating a contact", async ({ request }) => {
    const api = await apiAs(request, "repA")
    const res = await api.post("/api/contacts", {
      name: "Should Fail",
      email: `nope-${Date.now()}@test.local`,
    })
    expect(res.status()).toBe(403)
  })

  test("an admin is allowed", async ({ request }) => {
    const api = await apiAs(request, "admin")
    const res = await api.post("/api/contacts", {
      name: "Allowed",
      email: `ok-${Date.now()}@test.local`,
    })
    expect(res.status()).toBe(201)
  })
})

/**
 * Known gap, deliberately not failing the suite.
 *
 * components/common/RoleGuard.tsx exists but is imported nowhere, and no
 * sidebar item declares `roles` — so the client is role-blind. A rep is shown
 * "New contact", clicks it, and only then gets a 403 from the API. The data is
 * safe; the experience is not. Remove `.fixme` once the UI respects roles.
 */
test.fixme("a rep is not offered actions they cannot perform", async ({ as }) => {
  const page = await as("repA")
  await page.goto("/contacts")
  await expect(page.getByRole("button", { name: /new contact/i })).toHaveCount(0)
})
