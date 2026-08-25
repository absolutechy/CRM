import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"

// ---------------------------------------------------------------- validation

export const companyCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  industry: z.string().max(100).default(""),
  website: z.string().max(200).default(""),
  location: z.string().max(200).default(""),
  status: z.enum(["active", "lead", "churned"]).default("lead"),
})

export const companyUpdateSchema = companyCreateSchema.partial()

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>

export interface CompanyFilters {
  search?: string
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

// ---------------------------------------------------------------- service

export const listCompanies = async (
  filters: CompanyFilters,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const {
    search,
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

  const where: any = {}
  if (status) where.status = status

  if (search?.trim()) {
    const q = search.trim()
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ]
  }

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
  ])

  return {
    companies,
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getCompany = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: true,
      deals: true,
      activities: { orderBy: { at: "desc" }, take: 50 },
      documents: true,
      emails: true,
    },
  })

  if (!company) throw ApiError.notFound("Company not found")

  return company
}

export const createCompany = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = companyCreateSchema.parse(input)
  const company = await prisma.company.create({ data })
  return company
}

export const updateCompany = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.company.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Company not found")

  const data = companyUpdateSchema.parse(input)
  const company = await prisma.company.update({
    where: { id },
    data,
  })
  return company
}

export const deleteCompany = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.company.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Company not found")

  await prisma.company.delete({ where: { id } })
}
