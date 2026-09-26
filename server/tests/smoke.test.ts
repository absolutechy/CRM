import { describe, expect, it } from "vitest"

import { anonymous, as, makeActor } from "./helpers"

describe("harness", () => {
  it("serves health", async () => {
    const res = await anonymous().get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body.data.checks.database.status).toBe("up")
  })

  it("rejects unauthenticated access", async () => {
    const res = await anonymous().get("/api/contacts")
    expect(res.status).toBe(401)
  })

  it("logs in an actor of each role", async () => {
    for (const role of ["admin", "manager", "rep"] as const) {
      const actor = await makeActor(role)
      const res = await as(actor).get("/api/contacts")
      expect(res.status, `${role} should reach /api/contacts`).toBe(200)
    }
  })
})
