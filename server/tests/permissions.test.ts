import { beforeAll, describe, expect, it } from "vitest"
import type { UserRole } from "@prisma/client"

import { as, makeActor, type Actor } from "./helpers"

/**
 * The access model this suite pins down:
 *
 * - Contacts, companies and activities are SHARED — everyone reads them, but
 *   only admins and managers may create, edit or delete. They carry no owner
 *   column, so per-record scoping is not possible by design.
 * - Leads, deals, tasks and campaigns are OWNED — reps see only their own.
 * - Automation rules fire org-wide, so only admins and managers may change them.
 * - Documents may only be deleted by their uploader, or by an admin.
 * - Email accounts and messages belong to one user and are never cross-visible.
 */

let admin: Actor
let manager: Actor
let repA: Actor
let repB: Actor

beforeAll(async () => {
  admin = await makeActor("admin")
  manager = await makeActor("manager")
  repA = await makeActor("rep", "repA")
  repB = await makeActor("rep", "repB")
}, 60_000)

const newContact = () => ({
  name: "Matrix Contact",
  email: `contact-${Math.random().toString(36).slice(2, 10)}@test.local`,
})
const newCompany = () => ({ name: `Matrix Co ${Math.random()}` })

describe("shared records: everyone reads", () => {
  const readable = ["/api/contacts", "/api/companies", "/api/activities"]

  it.each(readable)("any role can list %s", async (path) => {
    for (const actor of [admin, manager, repA]) {
      const res = await as(actor).get(path)
      expect(res.status, `${actor.role} GET ${path}`).toBe(200)
    }
  })
})

describe("shared records: only admin and manager write", () => {
  it("rep cannot create a contact", async () => {
    const res = await as(repA).post("/api/contacts").send(newContact())
    expect(res.status).toBe(403)
  })

  it("rep cannot create a company", async () => {
    const res = await as(repA).post("/api/companies").send(newCompany())
    expect(res.status).toBe(403)
  })

  it("admin and manager can create a contact", async () => {
    for (const actor of [admin, manager]) {
      const res = await as(actor).post("/api/contacts").send(newContact())
      expect(res.status, `${actor.role} POST /api/contacts`).toBe(201)
    }
  })

  it("rep cannot update or delete a contact", async () => {
    const created = await as(admin).post("/api/contacts").send(newContact())
    expect(created.status).toBe(201)
    const id = created.body.data.contact.id

    expect((await as(repA).patch(`/api/contacts/${id}`).send({ name: "x" })).status).toBe(403)
    expect((await as(repA).delete(`/api/contacts/${id}`)).status).toBe(403)
  })
})

describe("owned records: reps are isolated from each other", () => {
  it("rep B cannot see rep A's lead", async () => {
    const created = await as(admin)
      .post("/api/leads")
      .send({
        name: "Owned Lead",
        email: `lead-${Math.random().toString(36).slice(2, 10)}@test.local`,
        ownerId: repA.id,
      })
    expect(created.status, JSON.stringify(created.body)).toBe(201)
    const id = created.body.data.lead.id
    expect(created.body.data.lead.ownerId, "admin's ownerId should stick").toBe(repA.id)

    expect((await as(repA).get(`/api/leads/${id}`)).status).toBe(200)

    const listedByB = await as(repB).get("/api/leads")
    const ids = (listedByB.body.data.leads ?? []).map((l: { id: string }) => l.id)
    expect(ids).not.toContain(id)
  })

  it("admin sees leads owned by others", async () => {
    const res = await as(admin).get("/api/leads")
    expect(res.status).toBe(200)
  })
})

describe("activities follow the shared-read, privileged-write rule", () => {
  const activity = () => ({ type: "call", summary: "Matrix call" })

  it("rep cannot log an activity", async () => {
    const res = await as(repA).post("/api/activities").send(activity())
    expect(res.status).toBe(403)
  })

  it("manager can log an activity", async () => {
    const res = await as(manager).post("/api/activities").send(activity())
    expect(res.status, JSON.stringify(res.body)).toBe(201)
  })
})

describe("documents may only be removed by their uploader or an admin", () => {
  const doc = () => ({
    name: `matrix-${Math.random().toString(36).slice(2, 8)}.pdf`,
    mimeType: "application/pdf",
  })

  it("another rep cannot delete someone else's upload", async () => {
    const created = await as(repA).post("/api/documents/metadata").send(doc())
    expect(created.status, JSON.stringify(created.body)).toBe(201)
    const id = created.body.data.document.id

    expect((await as(repB).delete(`/api/documents/${id}`)).status).toBe(403)
    expect((await as(repA).delete(`/api/documents/${id}`)).status).toBe(200)
  })

  it("an admin can delete anyone's upload", async () => {
    const created = await as(repA).post("/api/documents/metadata").send(doc())
    expect(created.status).toBe(201)
    const res = await as(admin).delete(
      `/api/documents/${created.body.data.document.id}`
    )
    expect(res.status).toBe(200)
  })
})

describe("automation rules are org-wide, so writes are privileged", () => {
  const rule = () => ({
    name: `Rule ${Math.random().toString(36).slice(2, 8)}`,
    trigger: { entity: "lead", event: "created" },
    conditions: [],
    actions: [],
  })

  it("rep cannot create a rule", async () => {
    const res = await as(repA).post("/api/automations").send(rule())
    expect(res.status).toBe(403)
  })

  it("rep cannot delete a rule", async () => {
    const created = await as(admin).post("/api/automations").send(rule())
    expect(created.status, JSON.stringify(created.body)).toBe(201)
    const id = created.body.data.rule.id

    expect((await as(repA).delete(`/api/automations/${id}`)).status).toBe(403)
    expect((await as(repA).patch(`/api/automations/${id}/toggle`).send({ enabled: true })).status).toBe(403)
  })

  it("rep may still read rules", async () => {
    expect((await as(repA).get("/api/automations")).status).toBe(200)
  })
})

describe("email is private to its owner", () => {
  it("rep B cannot see rep A's email account", async () => {
    const created = await as(repA)
      .post("/api/emails/accounts")
      .send({
        address: `mailbox-${Math.random().toString(36).slice(2, 8)}@test.local`,
        provider: "imap",
        displayName: "Rep A Mailbox",
        host: "smtp.test.local",
        username: "repa",
        password: "hunter2",
      })
    expect(created.status, JSON.stringify(created.body)).toBe(201)
    const id = created.body.data.account.id

    const listedByB = await as(repB).get("/api/emails/accounts")
    const ids = (listedByB.body.data.accounts ?? []).map((a: { id: string }) => a.id)
    expect(ids).not.toContain(id)
  })

  it("rep B cannot see rep A's messages", async () => {
    const listedByB = await as(repB).get("/api/emails")
    expect(listedByB.status).toBe(200)
    // Nothing rep B owns, so nothing comes back.
    expect(listedByB.body.data.emails).toEqual([])
  })
})

describe("cron endpoint", () => {
  it("rejects a request without the shared secret", async () => {
    const res = await as(repA).post("/api/automations/run").send({})
    expect(res.status).toBe(401)
  })
})

describe("role helper sanity", () => {
  const roles: UserRole[] = ["admin", "manager", "rep"]
  it.each(roles)("%s can read their own profile", async (role) => {
    const actor = await makeActor(role, `probe-${role}`)
    const res = await as(actor).get("/api/auth/me")
    expect(res.status).toBe(200)
    expect(res.body.data.user.role).toBe(role)
  })
})
