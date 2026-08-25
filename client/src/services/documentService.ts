import { apiBaseUrl, apiRequest, getAccessToken } from "./api"
import type { CrmDocument } from "@/types/crm"
import { pendingBackend, type ServiceResult } from "./types"

export interface UploadInput {
  file: File
  category: CrmDocument["category"]
  contactId?: string | null
  companyId?: string | null
  leadId?: string | null
  uploadedById: string
}

/** Multipart POST /api/documents — the file bytes go to S3 via the backend. */
export const uploadDocument = async (
  input: UploadInput
): Promise<ServiceResult<CrmDocument>> => {
  try {
    const form = new FormData()
    form.append("file", input.file)
    form.append("category", input.category)
    if (input.contactId) form.append("contactId", input.contactId)
    if (input.companyId) form.append("companyId", input.companyId)
    if (input.leadId) form.append("leadId", input.leadId)

    const token = getAccessToken()
    const res = await fetch(`${apiBaseUrl}/documents`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })

    const body = await res.json().catch(() => null)
    if (!res.ok || !body?.success) {
      return {
        ok: false,
        pending: false,
        message: body?.message ?? `Upload failed (${res.status})`,
      }
    }
    return { ok: true, pending: false, message: "Uploaded", data: body.data.document }
  } catch {
    return {
      ok: false,
      pending: false,
      message: "Upload failed — could not reach the server",
    }
  }
}

/** GET /api/documents/:id/download → signed S3 URL for the stored object. */
export const downloadDocument = async (
  documentId: string
): Promise<ServiceResult<string>> => {
  try {
    const { url } = await apiRequest<{ url: string }>(
      `/documents/${documentId}/download`
    )
    return { ok: true, pending: false, message: "Ready", data: url }
  } catch (error) {
    return {
      ok: false,
      pending: false,
      message:
        error instanceof Error ? error.message : "Download failed",
    }
  }
}

/** DELETE /api/documents/:id — removes the stored object + metadata row. */
export const deleteStoredFile = async (
  documentId: string
): Promise<ServiceResult> => {
  try {
    await apiRequest<void>(`/documents/${documentId}`, { method: "DELETE" })
    return { ok: true, pending: false, message: "Deleted" }
  } catch (error) {
    return {
      ok: false,
      pending: false,
      message: error instanceof Error ? error.message : "Delete failed",
    }
  }
}

export { pendingBackend }
