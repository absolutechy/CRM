import { z } from "zod"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"
import { canAccessAllRecords } from "@/lib/ownership"

// ---------------------------------------------------------------- validation

export const campaignTypeSchema = z.enum([
  "email",
  "event",
  "webinar",
  "social",
  "other",
])

export const campaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
])

export const campaignResponseSchema = z.enum([
  "none",
  "opened",
  "clicked",
  "replied",
  "converted",
])

export const campaignCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: campaignTypeSchema.default("email"),
  status: campaignStatusSchema.default("draft"),
  startDate: z.string().datetime().default(() => new Date().toISOString()),
  endDate: z.string().datetime().nullable().default(null),
  goal: z.string().max(2000).default(""),
  budget: z.number().nonnegative().nullable().default(null),
  ownerId: z.string().cuid().nullable().default(null),
  templateId: z.string().cuid().nullable().default(null),
})

export const campaignUpdateSchema = campaignCreateSchema.partial()

export const addMembersSchema = z.object({
  contactIds: z.array(z.string().cuid()).default([]),
  leadIds: z.array(z.string().cuid()).default([]),
})

export const setMemberResponseSchema = z.object({
  response: campaignResponseSchema,
})

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>

export interface CampaignFilters {
  status?: string
  type?: string
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

const serializeCampaign = (campaign: any) => ({
  ...campaign,
  budget: normalizeDecimal(campaign.budget),
})

// ---------------------------------------------------------------- service

export const listCampaigns = async (
  filters: CampaignFilters,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const {
    status,
    type,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "startDate",
    order = "desc",
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = {}

  // Ownership: reps see only their own campaigns; managers/admins see all.
  if (!canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
    where.ownerId = currentUserId
  }

  if (status) where.status = status
  if (type) where.type = type
  if (search?.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" }
  }

  const [total, campaigns] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    }),
  ])

  return {
    campaigns: campaigns.map(serializeCampaign),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getCampaign = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      members: {
        orderBy: { addedAt: "desc" },
        include: {
          contact: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!campaign) throw ApiError.notFound("Campaign not found")

  // Reps can only read their own campaigns.
  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    campaign.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  return serializeCampaign(campaign)
}

export const createCampaign = async (
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const data = campaignCreateSchema.parse(input)

  // Reps can only create campaigns for themselves.
  const ownerId =
    currentUserRole === "rep" ? currentUserId : data.ownerId ?? currentUserId

  if (data.ownerId && currentUserRole !== "rep") {
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
    if (!owner) throw ApiError.badRequest("Owner not found")
  }
  if (data.templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: data.templateId },
    })
    if (!template) throw ApiError.badRequest("Template not found")
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      type: data.type,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      goal: data.goal,
      budget: data.budget != null ? new Prisma.Decimal(data.budget) : null,
      ownerId,
      templateId: data.templateId,
    },
  })

  return serializeCampaign(campaign)
}

export const updateCampaign = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    existing.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  const data = campaignUpdateSchema.parse(input)

  // Reps cannot reassign a campaign.
  if (currentUserRole === "rep" && data.ownerId && data.ownerId !== currentUserId) {
    throw ApiError.forbidden("You cannot reassign this campaign")
  }

  if (data.ownerId && currentUserRole !== "rep") {
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
    if (!owner) throw ApiError.badRequest("Owner not found")
  }
  if (data.templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: data.templateId },
    })
    if (!template) throw ApiError.badRequest("Template not found")
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && {
        startDate: new Date(data.startDate),
      }),
      ...(data.endDate !== undefined && {
        endDate: data.endDate ? new Date(data.endDate) : null,
      }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.budget !== undefined && {
        budget: data.budget != null ? new Prisma.Decimal(data.budget) : null,
      }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.templateId !== undefined && { templateId: data.templateId }),
    },
  })

  return serializeCampaign(campaign)
}

export const deleteCampaign = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    existing.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  // Members cascade-delete with the campaign.
  await prisma.campaign.delete({ where: { id } })
}

// ---------------------------------------------------------------- members

export const addMembers = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    campaign.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  const { contactIds, leadIds } = addMembersSchema.parse(input)

  // Guard the exactly-one-of contactId/leadId constraint and duplicates.
  const addedAt = new Date()
  const rows = await prisma.$transaction(
    [...contactIds, ...leadIds].map((_id) => {
      const isContact = contactIds.includes(_id)
      return prisma.campaignMember.create({
        data: {
          campaignId: id,
          contactId: isContact ? _id : null,
          leadId: isContact ? null : _id,
          response: "none",
          addedAt,
        },
      })
    })
  )

  return rows
}

export const listMembers = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    campaign.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  return prisma.campaignMember.findMany({
    where: { campaignId: id },
    orderBy: { addedAt: "desc" },
    include: {
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
  })
}

export const setMemberResponse = async (
  id: string,
  memberId: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    campaign.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  const { response } = setMemberResponseSchema.parse(input)

  return prisma.campaignMember.update({
    where: { id: memberId },
    data: { response },
  })
}

export const removeMember = async (
  id: string,
  memberId: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) throw ApiError.notFound("Campaign not found")

  if (
    !canAccessAllRecords({ id: currentUserId, role: currentUserRole }) &&
    campaign.ownerId !== currentUserId
  ) {
    throw ApiError.forbidden("You do not have access to this campaign")
  }

  await prisma.campaignMember.deleteMany({
    where: { id: memberId, campaignId: id },
  })
}
