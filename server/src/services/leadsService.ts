import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"
import { canAccessAllRecords } from "@/lib/ownership"
import { evaluate } from "@/automations/engine"
import { Prisma } from "@prisma/client"

// ---------------------------------------------------------------- validation

export const LeadSource = z.enum([
  "web",
  "referral",
  "event",
  "outreach",
  "campaign",
  "other",
])

export const LeadStatus = z.enum([
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
])

export const leadCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  jobTitle: z.string().max(100).optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(50).optional(),
  companyName: z.string().max(100).optional(),
  source: LeadSource.default("web"),
  status: LeadStatus.default("new"),
  ownerId: z.string().uuid().nullable().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  campaignId: z.string().uuid().nullable().optional(),
})

export const leadUpdateSchema = leadCreateSchema.partial()

export type LeadCreateInput = z.infer<typeof leadCreateSchema>
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>

export interface LeadFilters {
  status?: string
  source?: string
  ownerId?: string
  campaignId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  order?: "asc" | "desc"
}

export interface ConvertOptions {
  companyId: string | null
  createCompany: boolean
  keepLead: boolean
}

// ---------------------------------------------------------------- pagination

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const normalizeDecimal = (value: Prisma.Decimal | null | undefined | number) =>
  value == null ? null : Number(value.toString())

const serializeLead = (lead: any) => ({
  ...lead,
  estimatedValue: normalizeDecimal(lead.estimatedValue),
})

// ---------------------------------------------------------------- service

export const listLeads = async (
  filters: LeadFilters,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const {
    status,
    source,
    ownerId,
    campaignId,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "updatedAt",
    order = "desc",
  } = filters

  const take = Math.min(Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = { deletedAt: null }

  if (canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
    if (ownerId) where.ownerId = ownerId
  } else {
    where.ownerId = currentUserId
  }

  if (status) {
    const statuses = status.split(",")
    where.status = { in: statuses }
  }
  if (source) {
    const sources = source.split(",")
    where.source = { in: sources }
  }
  if (campaignId) where.campaignId = campaignId

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        campaign: { select: { id: true, name: true } },
        convertedContact: { select: { id: true, name: true } },
        _count: { select: { activities: true, tasks: true } },
      },
    }),
  ])

  return {
    leads: leads.map(serializeLead),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getLeadById = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const lead = await prisma.lead.findUnique({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true } },
      convertedContact: { select: { id: true, name: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      tasks: { orderBy: { createdAt: "desc" }, take: 50 },
      documents: { orderBy: { uploadedAt: "desc" }, take: 50 },
    },
  })

  if (!lead) throw ApiError.notFound("Lead not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    lead.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this lead")
  }

  return serializeLead(lead)
}

export const createLead = async (
  input: LeadCreateInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const data = leadCreateSchema.parse(input)

  let ownerId = data.ownerId ?? currentUserId

  // Reps can only create leads for themselves.
  if (!canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
    ownerId = currentUserId
  } else if (data.ownerId) {
    // Validate the assigned owner exists.
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
    if (!owner) throw ApiError.badRequest("Assigned owner not found")
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      jobTitle: data.jobTitle ?? "",
      email: data.email,
      phone: data.phone ?? "",
      companyName: data.companyName ?? "",
      source: data.source,
      status: data.status,
      ownerId,
      estimatedValue: data.estimatedValue
        ? new Prisma.Decimal(data.estimatedValue)
        : null,
      notes: data.notes ?? "",
      campaignId: data.campaignId,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true } },
      convertedContact: { select: { id: true, name: true } },
    },
  })

  // Fire automation rules for lead creation.
  await evaluate({
    entity: "lead",
    event: "created",
    record: lead as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeLead(lead)
}

export const updateLead = async (
  id: string,
  input: LeadUpdateInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.lead.findUnique({ where: { id, deletedAt: null } })
  if (!existing) throw ApiError.notFound("Lead not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    existing.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this lead")
  }

  const data = leadUpdateSchema.parse(input)

  let ownerId = data.ownerId
  if (ownerId !== undefined) {
    if (!canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
      // Reps cannot reassign leads.
      ownerId = undefined
    } else if (ownerId !== null) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId } })
      if (!owner) throw ApiError.badRequest("Assigned owner not found")
    }
  }

  const lead = await prisma.lead.update({
    where: { id, deletedAt: null },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle ?? "" }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone ?? "" }),
      ...(data.companyName !== undefined && { companyName: data.companyName ?? "" }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.status !== undefined && { status: data.status }),
      ...(ownerId !== undefined && { ownerId }),
      ...(data.estimatedValue !== undefined && {
        estimatedValue:
          data.estimatedValue == null
            ? null
            : new Prisma.Decimal(data.estimatedValue),
      }),
      ...(data.notes !== undefined && { notes: data.notes ?? "" }),
      ...(data.campaignId !== undefined && { campaignId: data.campaignId }),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true } },
      convertedContact: { select: { id: true, name: true } },
    },
  })

  // Fire automation rules for lead updates.
  await evaluate({
    entity: "lead",
    event: "updated",
    record: lead as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeLead(lead)
}

export const deleteLead = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.lead.findUnique({ where: { id, deletedAt: null } })
  if (!existing) throw ApiError.notFound("Lead not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    existing.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this lead")
  }

  await prisma.lead.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export const convertLead = async (
  id: string,
  options: ConvertOptions,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.lead.findUnique({
    where: { id, deletedAt: null },
    include: { activities: true },
  })

  if (!existing) throw ApiError.notFound("Lead not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    existing.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this lead")
  }

  let companyId: string | null = options.companyId

  if (options.createCompany && existing.companyName.trim()) {
    const company = await prisma.company.create({
      data: {
        name: existing.companyName.trim(),
        industry: "",
        website: "",
        location: "",
        status: "active",
      },
    })
    companyId = company.id
  }

  const contact = await prisma.contact.create({
    data: {
      name: existing.name,
      jobTitle: existing.jobTitle,
      email: existing.email,
      phone: existing.phone,
      companyId,
      status: "Active",
      tags: ["converted-lead"],
    },
  })

  await prisma.activity.updateMany({
    where: { leadId: id },
    data: { contactId: contact.id, companyId },
  })

  // Log the conversion as an activity.
  await prisma.activity.create({
    data: {
      contactId: contact.id,
      leadId: options.keepLead ? id : null,
      companyId,
      type: "status_change",
      summary: "Converted from lead",
      body: `Lead created ${new Date(
        existing.createdAt
      ).toLocaleDateString()} via ${existing.source}.`,
      at: new Date(),
      actorId: currentUserId,
    },
  })

  await prisma.lead.update({
    where: { id },
    data: {
      status: "converted",
      convertedContactId: contact.id,
      convertedCompanyId: companyId,
      // keepLead=true keeps the (now-converted) lead visible; otherwise it is
      // soft-deleted so the lead list no longer shows it, but the conversion
      // audit trail is preserved.
      deletedAt: options.keepLead ? null : new Date(),
    },
  })

  // Fire automation rules for the status → converted transition.
  await evaluate({
    entity: "lead",
    event: "stage_changed",
    record: {
      id,
      status: "converted",
      name: existing.name,
      ownerId: existing.ownerId,
    } as Record<string, unknown>,
    actorId: currentUserId,
  })

  return {
    contactId: contact.id,
    companyId,
    leadId: options.keepLead ? id : null,
  }
}
