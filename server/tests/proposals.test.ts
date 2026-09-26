import { beforeAll, describe, expect, it } from "vitest"

import { prisma } from "@/lib/prisma"
import { createExtraction, type ExtractionResult } from "@/services/extractionService"

import { as, makeActor, type Actor } from "./helpers"

/**
 * No test here calls the Claude API. Extraction is exercised through an injected
 * fake extractor; approval — the part that actually writes to the CRM — is
 * exercised over HTTP against seeded proposals. So the suite needs no API key,
 * costs nothing, and cannot be flaky because of a model.
 */

let admin: Actor
let repA: Actor
let repB: Actor

beforeAll(async () => {
  admin = await makeActor("admin", "propadmin")
  repA = await makeActor("rep", "propreda")
  repB = await makeActor("rep", "propredb")
}, 60_000)

const uniq = () => Math.random().toString(36).slice(2, 10)

/** Seeds an extraction owned by `owner` with one change. */
const seedChange = async (
  owner: Actor,
  change: {
    entity: "contact" | "lead" | "deal" | "task" | "activity"
    action:
      | "create_record"
      | "update_field"
      | "move_stage"
      | "change_status"
      | "log_activity"
      | "create_task"
    label: string
    targetId?: string | null
    field?: string | null
    currentValue?: string | null
    proposedValue: string
  }
) => {
  const extraction = await prisma.extraction.create({
    data: {
      userId: owner.id,
      sourceLabel: "Test paste",
      rawText: "Seeded for tests. ".repeat(3),
      summary: "Seeded",
      changes: {
        create: {
          entity: change.entity,
          action: change.action,
          label: change.label,
          targetId: change.targetId ?? null,
          field: change.field ?? null,
          currentValue: change.currentValue ?? null,
          proposedValue: change.proposedValue,
          evidence: "quoted from the source",
        },
      },
    },
    include: { changes: true },
  })
  return { extraction, change: extraction.changes[0]! }
}

describe("extraction writes proposals, never records", () => {
  const fake = (result: ExtractionResult) => async () => result

  it("persists changes as pending and touches nothing", async () => {
    const contactsBefore = await prisma.contact.count()

    const extraction = await createExtraction(
      { text: "Sarah said the budget is now ninety thousand dollars.", sourceLabel: "Call" },
      repA.id,
      repA.role,
      fake({
        summary: "Budget update from a call",
        changes: [
          {
            entity: "deal",
            action: "update_field",
            label: "Deal amount",
            targetHint: "nonexistent deal",
            field: "amount",
            proposedValue: "90000",
            evidence: "the budget is now ninety thousand dollars",
          },
        ],
      })
    )

    expect(extraction.changes).toHaveLength(1)
    expect(extraction.changes[0]!.status).toBe("pending")
    expect(extraction.summary).toBe("Budget update from a call")
    expect(await prisma.contact.count(), "extraction must not write records").toBe(
      contactsBefore
    )
  })

  it("leaves targetId null when the hint matches nothing", async () => {
    const extraction = await createExtraction(
      { text: "Someone we have never heard of wants a call back soon.", sourceLabel: "" },
      repA.id,
      repA.role,
      fake({
        summary: "Unknown person",
        changes: [
          {
            entity: "contact",
            action: "update_field",
            label: "Phone",
            targetHint: `ghost-${uniq()}`,
            field: "phone",
            proposedValue: "+1 555 0100",
            evidence: "wants a call back",
          },
        ],
      })
    )
    expect(extraction.changes[0]!.targetId).toBeNull()
  })
})

describe("who may approve what", () => {
  it("a rep cannot approve a contact change, an admin can", async () => {
    const createdByAdmin = await as(admin)
      .post("/api/contacts")
      .send({ name: "Proposal Target", email: `pt-${uniq()}@test.local` })
    expect(createdByAdmin.status).toBe(201)
    const contactId = createdByAdmin.body.data.contact.id

    const forRep = await seedChange(repA, {
      entity: "contact",
      action: "update_field",
      label: "Phone",
      targetId: contactId,
      field: "phone",
      currentValue: "",
      proposedValue: "+44 20 7946 0000",
    })
    const refused = await as(repA).post(`/api/proposals/${forRep.change.id}/approve`)
    expect(refused.status, JSON.stringify(refused.body)).toBe(403)

    const forAdmin = await seedChange(admin, {
      entity: "contact",
      action: "update_field",
      label: "Phone",
      targetId: contactId,
      field: "phone",
      currentValue: "",
      proposedValue: "+44 20 7946 0001",
    })
    const allowed = await as(admin).post(`/api/proposals/${forAdmin.change.id}/approve`)
    expect(allowed.status, JSON.stringify(allowed.body)).toBe(200)

    const after = await prisma.contact.findUnique({ where: { id: contactId } })
    expect(after?.phone, "approval must actually write").toBe("+44 20 7946 0001")
  })

  it("a rep may approve a change to a lead they own", async () => {
    const lead = await as(admin)
      .post("/api/leads")
      .send({ name: "Owned Lead", email: `ol-${uniq()}@test.local`, ownerId: repA.id })
    expect(lead.status, JSON.stringify(lead.body)).toBe(201)
    const leadId = lead.body.data.lead.id

    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "update_field",
      label: "Job title",
      targetId: leadId,
      field: "jobTitle",
      currentValue: "",
      proposedValue: "VP Engineering",
    })
    const res = await as(repA).post(`/api/proposals/${seeded.change.id}/approve`)
    expect(res.status, JSON.stringify(res.body)).toBe(200)

    const after = await prisma.lead.findUnique({ where: { id: leadId } })
    expect(after?.jobTitle).toBe("VP Engineering")
  })

  it("a rep may not approve a change to a lead owned by someone else", async () => {
    const lead = await as(admin)
      .post("/api/leads")
      .send({ name: "Other Lead", email: `xl-${uniq()}@test.local`, ownerId: repB.id })
    expect(lead.status).toBe(201)

    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "update_field",
      label: "Job title",
      targetId: lead.body.data.lead.id,
      field: "jobTitle",
      currentValue: "",
      proposedValue: "Should not apply",
    })
    const res = await as(repA).post(`/api/proposals/${seeded.change.id}/approve`)
    expect(res.status).toBe(403)

    const after = await prisma.lead.findUnique({ where: { id: lead.body.data.lead.id } })
    expect(after?.jobTitle).not.toBe("Should not apply")
  })

  it("another user's proposals are not even visible", async () => {
    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "create_record",
      label: "New lead",
      proposedValue: "Private Prospect",
    })
    const res = await as(repB).post(`/api/proposals/${seeded.change.id}/approve`)
    expect(res.status).toBe(403)
  })
})

describe("a stale proposal cannot clobber a newer edit", () => {
  it("refuses when the record moved since the proposal", async () => {
    const lead = await as(admin)
      .post("/api/leads")
      .send({ name: "Moving Lead", email: `ml-${uniq()}@test.local`, ownerId: repA.id })
    const leadId = lead.body.data.lead.id

    // Proposed against jobTitle "" ...
    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "update_field",
      label: "Job title",
      targetId: leadId,
      field: "jobTitle",
      currentValue: "",
      proposedValue: "From the transcript",
    })

    // ... but a human edits it first.
    const edited = await as(repA)
      .patch(`/api/leads/${leadId}`)
      .send({ jobTitle: "Typed by a human" })
    expect(edited.status).toBe(200)

    const res = await as(repA).post(`/api/proposals/${seeded.change.id}/approve`)
    expect(res.status, JSON.stringify(res.body)).toBe(409)

    const after = await prisma.lead.findUnique({ where: { id: leadId } })
    expect(after?.jobTitle, "the human edit must survive").toBe("Typed by a human")
  })
})

describe("rejecting", () => {
  it("marks the change and writes nothing", async () => {
    const lead = await as(admin)
      .post("/api/leads")
      .send({ name: "Reject Lead", email: `rl-${uniq()}@test.local`, ownerId: repA.id })
    const leadId = lead.body.data.lead.id

    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "update_field",
      label: "Job title",
      targetId: leadId,
      field: "jobTitle",
      currentValue: "",
      proposedValue: "Never applied",
    })

    const res = await as(repA).post(`/api/proposals/${seeded.change.id}/reject`)
    expect(res.status).toBe(200)
    expect(res.body.data.change.status).toBe("rejected")

    const after = await prisma.lead.findUnique({ where: { id: leadId } })
    expect(after?.jobTitle).not.toBe("Never applied")
  })

  it("a change cannot be acted on twice", async () => {
    const seeded = await seedChange(repA, {
      entity: "lead",
      action: "create_record",
      label: "New lead",
      proposedValue: `Twice ${uniq()}`,
    })
    expect((await as(repA).post(`/api/proposals/${seeded.change.id}/reject`)).status).toBe(200)
    expect((await as(repA).post(`/api/proposals/${seeded.change.id}/approve`)).status).toBe(409)
  })
})

describe("approve all", () => {
  it("applies what it can and reports what it cannot", async () => {
    const contact = await as(admin)
      .post("/api/contacts")
      .send({ name: "Batch Target", email: `bt-${uniq()}@test.local` })
    const contactId = contact.body.data.contact.id

    // One change a rep may apply, one they may not.
    const extraction = await prisma.extraction.create({
      data: {
        userId: repA.id,
        rawText: "Batch source text for the approve-all test.",
        summary: "Batch",
        changes: {
          create: [
            {
              entity: "task",
              action: "create_task",
              label: "Follow-up task",
              proposedValue: `Send the proposal ${uniq()}`,
              evidence: "will send the proposal",
            },
            {
              entity: "contact",
              action: "update_field",
              label: "Phone",
              targetId: contactId,
              field: "phone",
              currentValue: "",
              proposedValue: "+1 555 0199",
              evidence: "reachable on",
            },
          ],
        },
      },
      include: { changes: true },
    })

    const res = await as(repA).post(
      `/api/proposals/extractions/${extraction.id}/approve-all`
    )
    expect(res.status, JSON.stringify(res.body)).toBe(200)
    expect(res.body.data.applied, "the task should apply").toBe(1)
    expect(res.body.data.failed).toHaveLength(1)
    expect(res.body.data.failed[0].label).toBe("Phone")

    const after = await prisma.contact.findUnique({ where: { id: contactId } })
    expect(after?.phone, "the refused change must not apply").not.toBe("+1 555 0199")
  })
})

describe("listing", () => {
  it("a rep sees only their own proposals", async () => {
    const mine = await seedChange(repA, {
      entity: "lead",
      action: "create_record",
      label: "Mine",
      proposedValue: `Mine ${uniq()}`,
    })
    const theirs = await seedChange(repB, {
      entity: "lead",
      action: "create_record",
      label: "Theirs",
      proposedValue: `Theirs ${uniq()}`,
    })

    const res = await as(repA).get("/api/proposals?status=pending")
    expect(res.status).toBe(200)
    const ids = res.body.data.proposals.map((p: { id: string }) => p.id)
    expect(ids).toContain(mine.change.id)
    expect(ids).not.toContain(theirs.change.id)
  })

  it("an admin sees everyone's", async () => {
    const theirs = await seedChange(repB, {
      entity: "lead",
      action: "create_record",
      label: "Theirs",
      proposedValue: `Admin sees ${uniq()}`,
    })
    const res = await as(admin).get("/api/proposals?status=pending")
    const ids = res.body.data.proposals.map((p: { id: string }) => p.id)
    expect(ids).toContain(theirs.change.id)
  })
})
