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

/**
 * File bytes are never stored — there is no storage backend yet.
 *
 * The UI reads `File` metadata (name / size / type) so the document row is
 * real, but the content is discarded.
 *
 * TODO(backend): POST the `File` as multipart to `/api/documents`, then use the
 * returned `{ id, url }` instead of the locally generated metadata record.
 */
export const uploadDocument = async (
  _input: UploadInput
): Promise<ServiceResult<CrmDocument>> =>
  pendingBackend(
    "File storage isn't connected yet — only the document details were recorded."
  )

/** TODO(backend): resolve a signed download URL for the stored object. */
export const downloadDocument = async (
  _documentId: string
): Promise<ServiceResult<string>> =>
  pendingBackend("Downloads need the storage backend.")

/** TODO(backend): delete the stored object alongside its metadata row. */
export const deleteStoredFile = async (
  _documentId: string
): Promise<ServiceResult> =>
  pendingBackend("Removing the stored file needs the storage backend.")
