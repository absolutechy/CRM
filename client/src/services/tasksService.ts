import { apiRequest } from "./api"
import type { Task, TaskPriority, TaskStatus } from "@/types/crm"

export interface TasksFilters {
  status?: TaskStatus
  assigneeId?: string
  contactId?: string
  leadId?: string
  dealId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "updatedAt" | "title" | "dueDate"
  order?: "asc" | "desc"
}

export interface PaginatedTasks {
  tasks: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getTasks = async (filters: TasksFilters = {}): Promise<PaginatedTasks> =>
  apiRequest<PaginatedTasks>("/tasks", {
    method: "GET",
    body: filters,
  })

export const getTask = async (id: string): Promise<{ task: Task }> =>
  apiRequest<{ task: Task }>(`/tasks/${id}`)

export const createTask = async (draft: Partial<Task>): Promise<{ task: Task }> =>
  apiRequest<{ task: Task }>("/tasks", {
    method: "POST",
    body: draft,
  })

export const updateTask = async (
  id: string,
  changes: Partial<Task>
): Promise<{ task: Task }> =>
  apiRequest<{ task: Task }>(`/tasks/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const changeTaskStatus = async (
  id: string,
  status: TaskStatus
): Promise<{ task: Task }> =>
  apiRequest<{ task: Task }>(`/tasks/${id}/status`, {
    method: "PATCH",
    body: { status },
  })

export const deleteTask = async (id: string): Promise<void> =>
  apiRequest<void>(`/tasks/${id}`, { method: "DELETE" })

export type { TaskPriority }
