import { apiRequest } from "./api"
import type { Extraction, ProposedChange } from "@/types/crm"

export interface ExtractInput {
  text: string
  sourceLabel?: string
}

export interface ApproveAllResult {
  applied: number
  failed: { id: string; label: string; error: string }[]
}

export const extractProposals = async (
  input: ExtractInput
): Promise<{ extraction: Extraction }> =>
  apiRequest<{ extraction: Extraction }>("/proposals/extract", {
    method: "POST",
    body: input,
  })

export const getProposals = async (
  filters: { status?: string } = {}
): Promise<{ proposals: ProposedChange[] }> =>
  apiRequest<{ proposals: ProposedChange[] }>("/proposals", {
    method: "GET",
    body: filters,
  })

export const approveProposal = async (
  id: string
): Promise<{ change: ProposedChange }> =>
  apiRequest<{ change: ProposedChange }>(`/proposals/${id}/approve`, {
    method: "POST",
  })

export const rejectProposal = async (
  id: string
): Promise<{ change: ProposedChange }> =>
  apiRequest<{ change: ProposedChange }>(`/proposals/${id}/reject`, {
    method: "POST",
  })

export const approveExtraction = async (
  extractionId: string
): Promise<ApproveAllResult> =>
  apiRequest<ApproveAllResult>(
    `/proposals/extractions/${extractionId}/approve-all`,
    { method: "POST" }
  )

export const discardExtraction = async (extractionId: string): Promise<void> =>
  apiRequest<void>(`/proposals/extractions/${extractionId}`, {
    method: "DELETE",
  })
