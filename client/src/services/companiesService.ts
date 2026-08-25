import { apiRequest } from "./api"
import type { Company, CompanyStatus } from "@/types/crm"

export interface CompaniesFilters {
  search?: string
  status?: CompanyStatus
  page?: number
  pageSize?: number
  sortBy?: "name" | "industry" | "location" | "createdAt" | "updatedAt"
  order?: "asc" | "desc"
}

export interface PaginatedCompanies {
  companies: Company[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getCompanies = async (
  filters: CompaniesFilters = {}
): Promise<PaginatedCompanies> =>
  apiRequest<PaginatedCompanies>("/companies", {
    method: "GET",
    body: filters,
  })

export const getCompany = async (id: string): Promise<{ company: Company }> =>
  apiRequest<{ company: Company }>(`/companies/${id}`)

export const createCompany = async (
  draft: Partial<Company>
): Promise<{ company: Company }> =>
  apiRequest<{ company: Company }>("/companies", {
    method: "POST",
    body: draft,
  })

export const updateCompany = async (
  id: string,
  changes: Partial<Company>
): Promise<{ company: Company }> =>
  apiRequest<{ company: Company }>(`/companies/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteCompany = async (id: string): Promise<void> =>
  apiRequest<void>(`/companies/${id}`, { method: "DELETE" })
