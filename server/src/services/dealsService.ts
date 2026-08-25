import { z } from "zod"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole, DealStage } from "@prisma/client"
import { canAccessAllRecords, assertOwnsRecord } from "@/lib/ownership"
import { evaluate } from "@/automations/engine"

// ---------------------------------------------------------------- validation

export const dealStageSchema = z.enum([
  "New",
  "Contacted",
  "Qualified",
  "Negotiation",
  "Won",
  "Lost",
])

export const dealCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  reference: z.string().min(1).max(50),
  contactId: z.string().cuid().nullable().default(null),
  companyId: z.string().cuid().nullable().default(null),
  ownerId: z.string().cuid().nullable().default(null),
  amount: z.number().nonnegative().default(0),
  currency: z.string().min(3).max(3).default("USD"),
  stage: dealStageSchema.default("New"),
  probability: z.number().int().min(0).max(100).default(10),
  expectedCloseDate: z.string().datetime().nullable().default(null),
  closedAt: z.string().datetime().nullable().default(null),
  notes: z.string().max(5000).default(""),
})

export const dealUpdateSchema = dealCreateSchema.partial()

/** Stage-change-only payload used by the kanban drag-and-drop. */
export const dealStageChangeSchema = z.object({
  stage: dealStageSchema,
})

export type DealCreateInput = z.infer<typeof dealCreateSchema>
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>

export interface DealFilters {
  stage?: string
  ownerId?: string
  companyId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  order?: "asc" | "desc"
}

// ---------------------------------------------------------------- helpers

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const normalizeDecimal = (value: Prisma.Decimal | null | undefined | number) =>
  value == null ? null : Number(value.toString())

const serializeDeal = (deal: any) => ({
  ...deal,
  amount: normalizeDecimal(deal.amount),
})

/** Stage → default win probability, mirroring client STAGE_PROBABILITY. */
const STAGE_PROBABILITY: Record<DealStage, number> = {
  New: 10,
  Contacted: 25,
  Qualified: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
}

/** Moving to a closed stage stamps closedAt + probability; opening clears it. */
const stageEffects = (stage: DealStage, closedAt?: Date | null) => {
  const closed = stage === "Won" || stage === "Lost"
  return {
    stage,
    probability: STAGE_PROBABILITY[stage],
    closedAt: closed ? (closedAt ?? new Date()) : null,
  }
}

// ---------------------------------------------------------------- service

export const listDeals = async (
  filters: DealFilters,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const {
    stage,
    ownerId,
    companyId,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "updatedAt",
    order = "desc",
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = {}

  // Ownership: reps see only their own deals; managers/admins see all.
  if (!canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
    where.ownerId = currentUserId
  } else if (ownerId) {
    where.ownerId = ownerId
  }

  if (stage) where.stage = stage
  if (companyId) where.companyId = companyId

  if (search?.trim()) {
    const q = search.trim()
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
    ]
  }

  const [total, deals] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    }),
  ])

  return {
    deals: deals.map(serializeDeal),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getDeal = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      tasks: true,
      documents: true,
    },
  })

  if (!deal) throw ApiError.notFound("Deal not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, deal.ownerId)

  return serializeDeal(deal)
}

export const createDeal = async (
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const data = dealCreateSchema.parse(input)

  // Reps can only create deals for themselves.
  const ownerId =
    currentUserRole === "rep" ? currentUserId : data.ownerId ?? currentUserId

  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company) throw ApiError.badRequest("Company not found")
  }
  if (ownerId && currentUserRole !== "rep") {
    const owner = await prisma.user.findUnique({ where: { id: ownerId } })
    if (!owner) throw ApiError.badRequest("Owner not found")
  }

  const deal = await prisma.deal.create({
    data: {
      title: data.title,
      reference: data.reference,
      contactId: data.contactId,
      companyId: data.companyId,
      ownerId,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency,
      stage: data.stage,
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate
        ? new Date(data.expectedCloseDate)
        : null,
      closedAt: data.closedAt ? new Date(data.closedAt) : null,
      notes: data.notes,
    },
  })

  // Fire automation rules for deal creation.
  await evaluate({
    entity: "deal",
    event: "created",
    record: deal as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeDeal(deal)
}

export const updateDeal = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.deal.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Deal not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.ownerId)

  const data = dealUpdateSchema.parse(input)

  // Reps cannot reassign a deal to another user.
  if (currentUserRole === "rep" && data.ownerId && data.ownerId !== currentUserId) {
    throw ApiError.forbidden("You cannot reassign this deal")
  }

  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company) throw ApiError.badRequest("Company not found")
  }
  if (data.ownerId && currentUserRole !== "rep") {
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
    if (!owner) throw ApiError.badRequest("Owner not found")
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.contactId !== undefined && { contactId: data.contactId }),
      ...(data.companyId !== undefined && { companyId: data.companyId }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.amount !== undefined && {
        amount: new Prisma.Decimal(data.amount),
      }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.stage !== undefined &&
        stageEffects(data.stage, existing.closedAt)),
      ...(data.probability !== undefined && { probability: data.probability }),
      ...(data.expectedCloseDate !== undefined && {
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })

  // Fire automation rules for deal updates.
  await evaluate({
    entity: "deal",
    event: "updated",
    record: deal as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeDeal(deal)
}

/** Kanban drag-and-drop: just move the stage, stamping closedAt when closed. */
export const changeDealStage = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const { stage } = dealStageChangeSchema.parse(input)
  const existing = await prisma.deal.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Deal not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.ownerId)

  const deal = await prisma.deal.update({
    where: { id },
    data: stageEffects(stage, existing.closedAt),
  })

  // Fire automation rules for the stage change.
  await evaluate({
    entity: "deal",
    event: "stage_changed",
    record: deal as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeDeal(deal)
}

export const deleteDeal = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.deal.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Deal not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.ownerId)

  await prisma.deal.delete({ where: { id } })
}
