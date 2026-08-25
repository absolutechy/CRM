import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Lead } from "@/types/crm"
import type { RootState } from "./index"
import {
  convertLead as convertLeadRequest,
  createLead as createLeadRequest,
  deleteLead as deleteLeadRequest,
  getLead as getLeadRequest,
  getLeads as getLeadsRequest,
  updateLead as updateLeadRequest,
  type ConvertOptions,
  type LeadsFilters,
} from "@/services/leadsService"

export type LeadDraft = Omit<Lead, "id" | "createdAt" | "updatedAt">

type LeadsStatus = "idle" | "loading" | "succeeded" | "failed"

const leadsAdapter = createEntityAdapter<Lead>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

interface LeadsState {
  status: LeadsStatus
  error: string | null
}

const initialState = leadsAdapter.getInitialState<LeadsState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchLeads = createAsyncThunk(
  "leads/fetchLeads",
  async (filters: LeadsFilters = {}) => {
    const { leads, pagination } = await getLeadsRequest(filters)
    return { leads, pagination }
  }
)

export const fetchLead = createAsyncThunk(
  "leads/fetchLead",
  async (id: string) => {
    const { lead } = await getLeadRequest(id)
    return lead
  }
)

export const createLead = createAsyncThunk(
  "leads/createLead",
  async (draft: Partial<Lead>) => {
    const { lead } = await createLeadRequest(draft)
    return lead
  }
)

export const updateLead = createAsyncThunk(
  "leads/updateLead",
  async ({ id, changes }: { id: string; changes: Partial<Lead> }) => {
    const { lead } = await updateLeadRequest(id, changes)
    return lead
  }
)

export const deleteLead = createAsyncThunk(
  "leads/deleteLead",
  async (id: string) => {
    await deleteLeadRequest(id)
    return id
  }
)

export const convertLead = createAsyncThunk(
  "leads/convertLead",
  async ({ id, options }: { id: string; options: ConvertOptions }) => {
    const result = await convertLeadRequest(id, options)
    return result
  }
)

// ---------------------------------------------------------------- slice

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    leadAdded: leadsAdapter.addOne,
    leadUpdated: leadsAdapter.updateOne,
    leadRemoved: leadsAdapter.removeOne,
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
        },
      })
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLeads
      .addCase(fetchLeads.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        leadsAdapter.setAll(state, action.payload.leads)
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load leads"
        toast.error("Failed to load leads")
      })

      // fetchLead
      .addCase(fetchLead.fulfilled, (state, action) => {
        leadsAdapter.upsertOne(state, action.payload)
      })

      // createLead
      .addCase(createLead.fulfilled, (state, action) => {
        leadsAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.name} added as a lead`)
      })
      .addCase(createLead.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create lead")
      })

      // updateLead
      .addCase(updateLead.fulfilled, (state, action) => {
        leadsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        })
        state.status = "succeeded"
        toast.success(`${action.payload.name} updated`)
      })
      .addCase(updateLead.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update lead")
      })

      // deleteLead
      .addCase(deleteLead.fulfilled, (state, action) => {
        leadsAdapter.removeOne(state, action.payload)
        toast.success("Lead deleted")
      })
      .addCase(deleteLead.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete lead")
      })

      // convertLead
      .addCase(convertLead.fulfilled, (state, action) => {
        if (action.payload.lead) {
          leadsAdapter.upsertOne(state, action.payload.lead)
        }
        toast.success("Lead converted to contact")
      })
      .addCase(convertLead.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to convert lead")
      })
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

export const selectLeadsStatus = (state: RootState) => state.leads.status
export const selectLeadsError = (state: RootState) => state.leads.error

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
