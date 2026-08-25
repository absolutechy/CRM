import { apiRequest } from "./api"
import type {
  Campaign,
  CampaignMember,
  CampaignResponse,
  CampaignStatus,
  CampaignType,
} from "@/types/crm"

export interface CampaignsFilters {
  status?: CampaignStatus
  type?: CampaignType
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "startDate" | "createdAt" | "name"
  order?: "asc" | "desc"
}

export interface PaginatedCampaigns {
  campaigns: Campaign[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getCampaigns = async (
  filters: CampaignsFilters = {}
): Promise<PaginatedCampaigns> =>
  apiRequest<PaginatedCampaigns>("/campaigns", {
    method: "GET",
    body: filters,
  })

export const getCampaign = async (id: string): Promise<{ campaign: Campaign }> =>
  apiRequest<{ campaign: Campaign }>(`/campaigns/${id}`)

export const createCampaign = async (
  draft: Partial<Campaign>
): Promise<{ campaign: Campaign }> =>
  apiRequest<{ campaign: Campaign }>("/campaigns", {
    method: "POST",
    body: draft,
  })

export const updateCampaign = async (
  id: string,
  changes: Partial<Campaign>
): Promise<{ campaign: Campaign }> =>
  apiRequest<{ campaign: Campaign }>(`/campaigns/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteCampaign = async (id: string): Promise<void> =>
  apiRequest<void>(`/campaigns/${id}`, { method: "DELETE" })

// ---- members

export const getMembers = async (
  id: string
): Promise<{ members: CampaignMember[] }> =>
  apiRequest<{ members: CampaignMember[] }>(`/campaigns/${id}/members`)

export const addMembers = async (
  id: string,
  input: { contactIds: string[]; leadIds: string[] }
): Promise<{ members: CampaignMember[] }> =>
  apiRequest<{ members: CampaignMember[] }>(`/campaigns/${id}/members`, {
    method: "POST",
    body: input,
  })

export const setMemberResponse = async (
  id: string,
  memberId: string,
  response: CampaignResponse
): Promise<{ member: CampaignMember }> =>
  apiRequest<{ member: CampaignMember }>(
    `/campaigns/${id}/members/${memberId}`,
    {
      method: "PATCH",
      body: { response },
    }
  )

export const removeMember = async (id: string, memberId: string): Promise<void> =>
  apiRequest<void>(`/campaigns/${id}/members/${memberId}`, {
    method: "DELETE",
  })
