import { apiRequest } from "./api"
import type { Activity, ActivityType, ActivityStatus } from "@/types/crm"

export interface ActivitiesFilters {
  contactId?: string
  companyId?: string
  leadId?: string
  actorId?: string
  type?: ActivityType
  status?: ActivityStatus
  page?: number
  pageSize?: number
}

export interface PaginatedActivities {
  activities: Activity[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getActivities = async (
  filters: ActivitiesFilters = {}
): Promise<PaginatedActivities> =>
  apiRequest<PaginatedActivities>("/activities", {
    method: "GET",
    body: filters,
  })

export const getActivity = async (id: string): Promise<{ activity: Activity }> =>
  apiRequest<{ activity: Activity }>(`/activities/${id}`)

export const createActivity = async (
  draft: Partial<Activity>
): Promise<{ activity: Activity }> =>
  apiRequest<{ activity: Activity }>("/activities", {
    method: "POST",
    body: draft,
  })

export const updateActivity = async (
  id: string,
  changes: Partial<Activity>
): Promise<{ activity: Activity }> =>
  apiRequest<{ activity: Activity }>(`/activities/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteActivity = async (id: string): Promise<void> =>
  apiRequest<void>(`/activities/${id}`, { method: "DELETE" })
