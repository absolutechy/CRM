import { apiRequest } from "./api"
import type { Deal, DealStage } from "@/types/crm"

export interface DealsFilters {
  stage?: DealStage | DealStage[]
  ownerId?: string
  companyId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "updatedAt" | "title" | "amount" | "stage"
  order?: "asc" | "desc"
}

export interface PaginatedDeals {
  deals: Deal[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getDeals = async (filters: DealsFilters = {}): Promise<PaginatedDeals> =>
  apiRequest<PaginatedDeals>("/deals", {
    method: "GET",
    body: filters,
  })

export const getDeal = async (id: string): Promise<{ deal: Deal }> =>
  apiRequest<{ deal: Deal }>(`/deals/${id}`)

export const createDeal = async (draft: Partial<Deal>): Promise<{ deal: Deal }> =>
  apiRequest<{ deal: Deal }>("/deals", {
    method: "POST",
    body: draft,
  })

export const updateDeal = async (
  id: string,
  changes: Partial<Deal>
): Promise<{ deal: Deal }> =>
  apiRequest<{ deal: Deal }>(`/deals/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const changeDealStage = async (
  id: string,
  stage: DealStage
): Promise<{ deal: Deal }> =>
  apiRequest<{ deal: Deal }>(`/deals/${id}/stage`, {
    method: "PATCH",
    body: { stage },
  })

export const deleteDeal = async (id: string): Promise<void> =>
  apiRequest<void>(`/deals/${id}`, { method: "DELETE" })
