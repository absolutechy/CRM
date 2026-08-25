import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"
import type { Contact } from "@prisma/client"
import { evaluate } from "@/automations/engine"

// ---------------------------------------------------------------- validation

const addressSchema = z.object({
  street: z.string().max(200).default(""),
  city: z.string().max(100).default(""),
  state: z.string().max(100).default(""),
  postalCode: z.string().max(20).default(""),
  country: z.string().max(100).default(""),
})

const socialSchema = z.object({
  linkedin: z.string().max(200).default(""),
  twitter: z.string().max(200).default(""),
  website: z.string().max(200).default(""),
})

export const contactCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  jobTitle: z.string().max(100).default(""),
  email: z.string().email("Valid email is required").toLowerCase(),
  phone: z.string().max(50).default(""),
  companyId: z.string().cuid().nullable().default(null),
  status: z.enum(["Active", "Inactive", "Pending"]).default("Active"),
  tags: z.array(z.string().max(50)).default([]),
  address: addressSchema.optional(),
  social: socialSchema.optional(),
})

export const contactUpdateSchema = contactCreateSchema.partial()

export type ContactCreateInput = z.infer<typeof contactCreateSchema>
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>

export interface ContactFilters {
  search?: string
  companyId?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  order?: "asc" | "desc"
}

// ---------------------------------------------------------------- helpers

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const serializeContact = (contact: Contact) => contact

const normalizeTags = (tags: string[] | undefined) =>
  (tags ?? []).map((t) => t.trim()).filter(Boolean)

/** Returns the existing contact owning this email, or null. */
export const findContactByEmail = (email: string, excludeId?: string) =>
  prisma.contact.findFirst({
    where: {
      email: email.toLowerCase(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

// ---------------------------------------------------------------- service

export const listContacts = async (
  filters: ContactFilters,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const {
    search,
    companyId,
    status,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "name",
    order = "asc",
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  // Contacts are not owned by a user in the schema — everyone with an account
  // sees the shared contact list. Row-level ownership is deferred until a
  // Company.ownerId / Contact.ownerId exists.
  const where: any = {}

  if (companyId) where.companyId = companyId
  if (status) where.status = status

  if (search?.trim()) {
    const q = search.trim()
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { jobTitle: { contains: q, mode: "insensitive" } },
    ]
  }

  const [total, contacts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
  ])

  return {
    contacts: contacts.map(serializeContact),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getContact = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: true,
      activities: { orderBy: { at: "desc" }, take: 50 },
      tasks: true,
      documents: true,
      emails: true,
      conversations: true,
    },
  })

  if (!contact) throw ApiError.notFound("Contact not found")

  return contact
}

export const createContact = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = contactCreateSchema.parse(input)

  // Duplicate guard: same email on a different record. The UI warns before
  // submit; the API enforces it so a second tab can't slip one through.
  const existing = await findContactByEmail(data.email)
  if (existing) {
    throw ApiError.conflict("A contact with this email already exists")
  }

  if (data.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    })
    if (!company) throw ApiError.badRequest("Company not found")
  }

  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      jobTitle: data.jobTitle,
      email: data.email,
      phone: data.phone,
      companyId: data.companyId,
      status: data.status,
      tags: normalizeTags(data.tags),
      address: data.address ?? {},
      social: data.social ?? {},
    },
  })

  // Fire automation rules for contact creation.
  await evaluate({
    entity: "contact",
    event: "created",
    record: contact as unknown as Record<string, unknown>,
  })

  return contact
}

export const updateContact = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.contact.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Contact not found")

  const data = contactUpdateSchema.parse(input)

  // Duplicate guard on email change (ignore the record itself).
  if (data.email && data.email !== existing.email) {
    const dup = await findContactByEmail(data.email, id)
    if (dup) throw ApiError.conflict("A contact with this email already exists")
  }

  // Validate the target company exists when reassigning.
  if (data.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    })
    if (!company) throw ApiError.badRequest("Company not found")
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.companyId !== undefined && { companyId: data.companyId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: normalizeTags(data.tags) }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.social !== undefined && { social: data.social }),
    },
  })

  // Fire automation rules for contact updates.
  await evaluate({
    entity: "contact",
    event: "updated",
    record: contact as unknown as Record<string, unknown>,
  })

  return contact
}

export const deleteContact = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.contact.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Contact not found")

  await prisma.contact.delete({ where: { id } })
}
