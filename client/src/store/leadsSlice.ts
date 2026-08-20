import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Lead } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_LEADS } from "./seed"

const leadsAdapter = createEntityAdapter<Lead>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

export type LeadDraft = Omit<Lead, "id" | "createdAt" | "updatedAt">

const leadsSlice = createSlice({
  name: "leads",
  initialState: leadsAdapter.setAll(leadsAdapter.getInitialState(), SEED_LEADS),
  reducers: {
    leadAdded: {
      reducer: leadsAdapter.addOne,
      prepare: (draft: LeadDraft) => {
        const now = new Date().toISOString()
        return {
          payload: { ...draft, id: nanoid(), createdAt: now, updatedAt: now } satisfies Lead,
        }
      },
    },
    leadUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Lead> }>
    ) => {
      leadsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    leadRemoved: leadsAdapter.removeOne,
    /** Records the outcome of converting a lead into a contact/account. */
    leadConverted: (
      state,
      action: PayloadAction<{
        id: string
        contactId: string
        companyId: string | null
      }>
    ) => {
      leadsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          status: "converted",
          convertedContactId: action.payload.contactId,
          convertedCompanyId: action.payload.companyId,
          updatedAt: new Date().toISOString(),
        },
      })
    },
  },
})

export const { leadAdded, leadUpdated, leadRemoved, leadConverted } =
  leadsSlice.actions

export default leadsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllLeads,
  selectById: selectLeadById,
  selectEntities: selectLeadEntities,
} = leadsAdapter.getSelectors<RootState>((state) => state.leads)

export const selectLeadsByStatus = createSelector([selectAllLeads], (leads) => {
  const grouped: Record<string, Lead[]> = {}
  for (const lead of leads) {
    ;(grouped[lead.status] ??= []).push(lead)
  }
  return grouped
})

export const selectLeadsByOwner = createSelector(
  [selectAllLeads, (_: RootState, ownerId: string) => ownerId],
  (leads, ownerId) => leads.filter((l) => l.ownerId === ownerId)
)

export const selectLeadsByCampaign = createSelector(
  [selectAllLeads, (_: RootState, campaignId: string) => campaignId],
  (leads, campaignId) => leads.filter((l) => l.campaignId === campaignId)
)

/** Open pipeline value — excludes converted and unqualified leads. */
export const selectLeadPipelineValue = createSelector([selectAllLeads], (leads) =>
  leads
    .filter((l) => l.status !== "converted" && l.status !== "unqualified")
    .reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0)
)
