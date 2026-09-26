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

test.describe("the UI only offers what the API allows", () => {
  test("a rep is not offered contact write actions", async ({ as }) => {
    const page = await as("repA")
    await page.goto("/contacts")
    await expect(page.getByText("E2E Shared Contact")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /new contact/i })
    ).toHaveCount(0)
  })

  test("an admin is offered them", async ({ as }) => {
    const page = await as("admin")
    await page.goto("/contacts")
    await expect(
      page.getByRole("button", { name: /new contact/i })
    ).toBeVisible()
  })

  test("a rep is not offered company write actions", async ({ as }) => {
    const page = await as("repA")
    await page.goto("/companies")
    await expect(
      page.getByRole("button", { name: /new company/i })
    ).toHaveCount(0)
  })

  test("automations are hidden from a rep's sidebar", async ({ as }) => {
    const page = await as("repA")
    await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Automations" })
    ).toHaveCount(0)
  })

  test("a manager sees automations in the sidebar", async ({ as }) => {
    const page = await as("manager")
    await expect(page.getByRole("link", { name: "Automations" })).toBeVisible()
  })

  test("a rep typing the automations URL gets a refusal, not a broken page", async ({
    as,
  }) => {
    const page = await as("repA")
    await page.goto("/automations")
    await expect(
      page.getByText("You don't have access to this page")
    ).toBeVisible()
  })
})
