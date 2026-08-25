import { apiRequest } from "./api"
import type { Lead, LeadStatus, LeadSource } from "@/types/crm"

export interface LeadsFilters {
  status?: LeadStatus | LeadStatus[]
  source?: LeadSource | LeadSource[]
  ownerId?: string | null
  campaignId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "updatedAt" | "name" | "estimatedValue"
  order?: "asc" | "desc"
}

export interface PaginatedLeads {
  leads: Lead[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ConvertOptions {
  companyId: string | null
  createCompany: boolean
  keepLead: boolean
}

export const getLeads = async (filters: LeadsFilters = {}): Promise<PaginatedLeads> =>
  apiRequest<PaginatedLeads>("/leads", {
    method: "GET",
    body: filters,
  })

export const getLead = async (id: string): Promise<{ lead: Lead }> =>
  apiRequest<{ lead: Lead }>(`/leads/${id}`)

export const createLead = async (draft: Partial<Lead>): Promise<{ lead: Lead }> =>
  apiRequest<{ lead: Lead }>("/leads", {
    method: "POST",
    body: draft,
  })

export const updateLead = async (
  id: string,
  changes: Partial<Lead>
): Promise<{ lead: Lead }> =>
  apiRequest<{ lead: Lead }>(`/leads/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteLead = async (id: string): Promise<void> =>
  apiRequest<void>(`/leads/${id}`, { method: "DELETE" })

export const convertLead = async (
  id: string,
  options: ConvertOptions
): Promise<{ contactId: string; companyId: string | null; lead?: Lead }> =>
  apiRequest<{ contactId: string; companyId: string | null; lead?: Lead }>(
    `/leads/${id}/convert`,
    {
      method: "POST",
      body: options,
    }
  )
