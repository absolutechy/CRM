import type { ProposalEntity, ProposedChange, UserRole } from "@prisma/client"

import { ApiError } from "@/lib/http"
import { prisma } from "@/lib/prisma"
import { canAccessAllRecords } from "@/lib/ownership"
import { createActivity } from "@/services/activitiesService"
import { createContact, updateContact } from "@/services/contactsService"
import { changeDealStage, createDeal, updateDeal } from "@/services/dealsService"
import { createLead, leadCreateSchema, updateLead } from "@/services/leadsService"
import { changeTaskStatus, createTask } from "@/services/tasksService"

interface Actor {
  id: string
  role: UserRole
}

// ---------------------------------------------------------------- policy

/**
 * Entities with no owner column are shared across the workspace, and the rule
 * that only admins and managers may write them lives on the route
 * (`authorize("admin", "manager")` in routes/contacts.ts). Approving a proposal
 * does not pass through that route, so the rule has to be restated here.
 *
 * This duplication is a privilege hole if the two ever drift, which is why
 * tests/proposals.test.ts asserts the full entity x role matrix.
 */
const SHARED_ENTITIES: ProposalEntity[] = ["contact", "activity"]

export const canApplyChange = (change: ProposedChange, actor: Actor): boolean => {
  if (SHARED_ENTITIES.includes(change.entity)) {
    return canAccessAllRecords(actor)
  }
  // Owned entities (lead, deal, task) are enforced by their own services, which
  // throw 403 when a rep touches a record they do not own.
  return true
}

const assertCanApply = (change: ProposedChange, actor: Actor) => {
  if (!canApplyChange(change, actor)) {
    throw ApiError.forbidden(
      `Only admins and managers can approve ${change.entity} changes`
    )
  }
}

// ---------------------------------------------------------------- staleness

const readCurrentValue = async (
  change: ProposedChange
): Promise<string | null> => {
  if (!change.targetId || !change.field) return null

  const field = change.field
  const read = (row: Record<string, unknown> | null) => {
    if (!row) return null
    const value = row[field]
    if (value === null || value === undefined) return null
    return value instanceof Date ? value.toISOString() : String(value)
  }

  switch (change.entity) {
    case "contact":
      return read(await prisma.contact.findUnique({ where: { id: change.targetId } }))
    case "lead":
      return read(await prisma.lead.findUnique({ where: { id: change.targetId } }))
    case "deal":
      return read(await prisma.deal.findUnique({ where: { id: change.targetId } }))
    case "task":
      return read(await prisma.task.findUnique({ where: { id: change.targetId } }))
    default:
      return null
  }
}

/**
 * A proposal is a claim about a record at a point in time. If the record moved
 * on since, applying blindly would silently overwrite a newer human edit — so
 * the reviewer is told instead.
 */
const assertNotStale = async (change: ProposedChange) => {
  if (!change.targetId || !change.field) return
  const now = await readCurrentValue(change)
  if (now !== change.currentValue) {
    throw ApiError.conflict(
      `This record changed since the proposal was made (now "${now ?? "empty"}"). Re-extract to pick up the current value.`
    )
  }
}

// ---------------------------------------------------------------- apply

/**
 * Every branch calls the normal service function rather than Prisma directly,
 * so approved changes get the same Zod validation, ownership checks, status and
 * decimal mapping, and automation cascade as a manual edit would.
 */
const applyChange = async (change: ProposedChange, actor: Actor): Promise<string> => {
  const value = change.proposedValue ?? ""
  const field = change.field ?? ""

  switch (change.action) {
    case "create_record": {
      if (change.entity === "contact") {
        const contact = await createContact(
          { name: value, email: fabricatedEmail(value) },
          actor.id,
          actor.role
        )
        return contact.id
      }
      if (change.entity === "lead") {
        // createLead takes the schema's output type, so defaults must already
        // be applied — parse rather than cast.
        const lead = await createLead(
          leadCreateSchema.parse({ name: value, email: fabricatedEmail(value) }),
          actor.id,
          actor.role
        )
        return lead.id
      }
      if (change.entity === "deal") {
        const deal = await createDeal(
          { title: value, reference: `AI-${Date.now().toString(36)}` },
          actor.id,
          actor.role
        )
        return deal.id
      }
      throw ApiError.badRequest(`Cannot create a ${change.entity} from a proposal`)
    }

    case "update_field": {
      if (!change.targetId) {
        throw ApiError.badRequest("This change has no target record yet")
      }
      const patch = { [field]: value }
      if (change.entity === "contact") {
        await updateContact(change.targetId, patch, actor.id, actor.role)
        return change.targetId
      }
      if (change.entity === "lead") {
        await updateLead(change.targetId, patch, actor.id, actor.role)
        return change.targetId
      }
      if (change.entity === "deal") {
        await updateDeal(change.targetId, patch, actor.id, actor.role)
        return change.targetId
      }
      throw ApiError.badRequest(`Cannot update a ${change.entity} from a proposal`)
    }

    case "move_stage": {
      if (!change.targetId) throw ApiError.badRequest("This change has no target deal")
      await changeDealStage(change.targetId, { stage: value }, actor.id, actor.role)
      return change.targetId
    }

    case "change_status": {
      if (!change.targetId) throw ApiError.badRequest("This change has no target task")
      await changeTaskStatus(change.targetId, { status: value }, actor.id, actor.role)
      return change.targetId
    }

    case "create_task": {
      const task = await createTask({ title: value }, actor.id, actor.role)
      return task.id
    }

    case "log_activity": {
      const activity = await createActivity(
        {
          type: "note",
          summary: value.slice(0, 300),
          body: change.evidence || null,
          ...(change.entity === "contact" && change.targetId
            ? { contactId: change.targetId }
            : {}),
          ...(change.entity === "lead" && change.targetId
            ? { leadId: change.targetId }
            : {}),
        },
        actor.id,
        actor.role
      )
      return activity.id
    }
  }
}

/** Creates need an email and the source rarely has one; make it obvious. */
const fabricatedEmail = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "unknown"}@needs-an-email.invalid`

// ---------------------------------------------------------------- service

const visibilityFilter = (actor: Actor) =>
  canAccessAllRecords(actor) ? {} : { extraction: { userId: actor.id } }

export const listProposals = async (
  filters: { status?: string },
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const actor = { id: currentUserId, role: currentUserRole }
  return prisma.proposedChange.findMany({
    where: {
      ...visibilityFilter(actor),
      ...(filters.status ? { status: filters.status as ProposedChange["status"] } : {}),
    },
    include: {
      extraction: {
        select: { id: true, sourceLabel: true, summary: true, createdAt: true, userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
}

export const getExtraction = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const actor = { id: currentUserId, role: currentUserRole }
  const extraction = await prisma.extraction.findUnique({
    where: { id },
    include: { changes: { orderBy: { createdAt: "asc" } } },
  })
  if (!extraction) throw ApiError.notFound("Extraction not found")
  if (!canAccessAllRecords(actor) && extraction.userId !== currentUserId) {
    throw ApiError.forbidden("You do not have access to this extraction")
  }
  return extraction
}

const loadChange = async (id: string, actor: Actor) => {
  const change = await prisma.proposedChange.findUnique({
    where: { id },
    include: { extraction: { select: { userId: true } } },
  })
  if (!change) throw ApiError.notFound("Proposed change not found")
  if (!canAccessAllRecords(actor) && change.extraction.userId !== actor.id) {
    throw ApiError.forbidden("You do not have access to this change")
  }
  if (change.status !== "pending") {
    throw ApiError.conflict(`This change was already ${change.status}`)
  }
  return change
}

export const approveChange = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const actor = { id: currentUserId, role: currentUserRole }
  const change = await loadChange(id, actor)

  assertCanApply(change, actor)
  await assertNotStale(change)

  try {
    const targetId = await applyChange(change, actor)
    return prisma.proposedChange.update({
      where: { id },
      data: {
        status: "applied",
        targetId,
        reviewedById: currentUserId,
        reviewedAt: new Date(),
        appliedAt: new Date(),
        error: null,
      },
    })
  } catch (error) {
    // A failed change is recorded, not discarded — the reviewer needs to see why.
    const message = error instanceof Error ? error.message : "Unknown error"
    await prisma.proposedChange.update({
      where: { id },
      data: {
        status: "failed",
        reviewedById: currentUserId,
        reviewedAt: new Date(),
        error: message,
      },
    })
    throw error
  }
}

export const rejectChange = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const actor = { id: currentUserId, role: currentUserRole }
  await loadChange(id, actor)
  return prisma.proposedChange.update({
    where: { id },
    data: { status: "rejected", reviewedById: currentUserId, reviewedAt: new Date() },
  })
}

/**
 * Applies every pending change the actor is allowed to apply, and reports the
 * rest rather than aborting — one unapprovable row must not block the batch.
 */
export const approveExtraction = async (
  extractionId: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const extraction = await getExtraction(extractionId, currentUserId, currentUserRole)
  const pending = extraction.changes.filter((c) => c.status === "pending")

  const applied: string[] = []
  const failed: { id: string; label: string; error: string }[] = []

  for (const change of pending) {
    try {
      await approveChange(change.id, currentUserId, currentUserRole)
      applied.push(change.id)
    } catch (error) {
      failed.push({
        id: change.id,
        label: change.label,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return { applied: applied.length, failed }
}

export const deleteExtraction = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  await getExtraction(id, currentUserId, currentUserRole)
  await prisma.extraction.delete({ where: { id } })
}
