import { apiRequest } from "./api"
import type { Contact, ContactStatus } from "@/types/crm"

export interface ContactsFilters {
  search?: string
  companyId?: string
  status?: ContactStatus | ContactStatus[]
  page?: number
  pageSize?: number
  sortBy?: "name" | "createdAt" | "updatedAt" | "email" | "jobTitle"
  order?: "asc" | "desc"
}

export interface PaginatedContacts {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const getContacts = async (
  filters: ContactsFilters = {}
): Promise<PaginatedContacts> =>
  apiRequest<PaginatedContacts>("/contacts", {
    method: "GET",
    body: filters,
  })

export const getContact = async (id: string): Promise<{ contact: Contact }> =>
  apiRequest<{ contact: Contact }>(`/contacts/${id}`)

export const createContact = async (
  draft: Partial<Contact>
): Promise<{ contact: Contact }> =>
  apiRequest<{ contact: Contact }>("/contacts", {
    method: "POST",
    body: draft,
  })

export const updateContact = async (
  id: string,
  changes: Partial<Contact>
): Promise<{ contact: Contact }> =>
  apiRequest<{ contact: Contact }>(`/contacts/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteContact = async (id: string): Promise<void> =>
  apiRequest<void>(`/contacts/${id}`, { method: "DELETE" })
