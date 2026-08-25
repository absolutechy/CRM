import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"

// ---------------------------------------------------------------- validation

export const activityTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "note",
  "inquiry",
  "created",
  "status_change",
])

export const activityStatusSchema = z.enum(["logged", "planned"])

export const activityDirectionSchema = z.enum(["inbound", "outbound"])

export const activityCreateSchema = z.object({
  contactId: z.string().cuid().nullable().default(null),
  leadId: z.string().cuid().nullable().default(null),
  companyId: z.string().cuid().nullable().default(null),
  type: activityTypeSchema,
  status: activityStatusSchema.default("logged"),
  direction: activityDirectionSchema.nullable().default(null),
  summary: z.string().min(1, "Summary is required").max(300),
  body: z.string().max(5000).nullable().default(null),
  at: z.string().datetime().nullable().default(null),
  scheduledAt: z.string().datetime().nullable().default(null),
  durationMinutes: z.number().int().nonnegative().nullable().default(null),
})

export const activityUpdateSchema = activityCreateSchema.partial()

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>

export interface ActivityFilters {
  contactId?: string
  companyId?: string
  leadId?: string
  actorId?: string
  type?: string
  status?: string
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------- helpers

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

// ---------------------------------------------------------------- service

export const listActivities = async (
  filters: ActivityFilters,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const {
    contactId,
    companyId,
    leadId,
    actorId,
    type,
    status,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = {}
  if (contactId) where.contactId = contactId
  if (companyId) where.companyId = companyId
  if (leadId) where.leadId = leadId
  if (actorId) where.actorId = actorId
  if (type) where.type = type
  if (status) where.status = status

  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { at: "desc" },
      skip,
      take,
      include: {
        contact: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        actor: { select: { id: true, name: true } },
      },
    }),
  ])

  return {
    activities,
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getActivity = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      actor: { select: { id: true, name: true } },
    },
  })

  if (!activity) throw ApiError.notFound("Activity not found")
  return activity
}

export const createActivity = async (
  input: unknown,
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = activityCreateSchema.parse(input)

  // Validate the linked records exist.
  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company) throw ApiError.badRequest("Company not found")
  }
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } })
    if (!lead) throw ApiError.badRequest("Lead not found")
  }

  const at = data.at ? new Date(data.at) : data.scheduledAt ? new Date(data.scheduledAt) : new Date()

  const activity = await prisma.activity.create({
    data: {
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      type: data.type,
      status: data.status,
      direction: data.direction,
      summary: data.summary,
      body: data.body,
      at,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      durationMinutes: data.durationMinutes,
      actorId: currentUserId,
    },
  })

  return activity
}

export const updateActivity = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.activity.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Activity not found")

  const data = activityUpdateSchema.parse(input)

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...(data.contactId !== undefined && { contactId: data.contactId }),
      ...(data.leadId !== undefined && { leadId: data.leadId }),
      ...(data.companyId !== undefined && { companyId: data.companyId }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.direction !== undefined && { direction: data.direction }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.at !== undefined && { at: data.at ? new Date(data.at) : new Date() }),
      ...(data.scheduledAt !== undefined && {
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      }),
      ...(data.durationMinutes !== undefined && {
        durationMinutes: data.durationMinutes,
      }),
    },
  })

  return activity
}

export const deleteActivity = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.activity.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Activity not found")

  await prisma.activity.delete({ where: { id } })
}
