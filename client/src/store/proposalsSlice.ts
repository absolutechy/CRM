import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { RootState } from "./index"
import type { ProposedChange } from "@/types/crm"
import {
  approveExtraction as approveExtractionRequest,
  approveProposal as approveProposalRequest,
  discardExtraction as discardExtractionRequest,
  extractProposals as extractProposalsRequest,
  getProposals as getProposalsRequest,
  rejectProposal as rejectProposalRequest,
  type ExtractInput,
} from "@/services/proposalsService"

const proposalsAdapter = createEntityAdapter<ProposedChange>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

type ProposalsStatus = "idle" | "loading" | "succeeded" | "failed"

interface ProposalsState {
  status: ProposalsStatus
  error: string | null
  /** Separate from `status`: extraction is slow and has its own spinner. */
  extracting: boolean
}

const initialState = proposalsAdapter.getInitialState<ProposalsState>({
  status: "idle",
  error: null,
  extracting: false,
})

// ---------------------------------------------------------------- thunks

export const fetchProposals = createAsyncThunk(
  "proposals/fetchProposals",
  async (filters: { status?: string } | undefined = {}) => {
    const { proposals } = await getProposalsRequest(filters ?? {})
    return proposals
  }
)

export const extractProposals = createAsyncThunk(
  "proposals/extract",
  async (input: ExtractInput) => {
    const { extraction } = await extractProposalsRequest(input)
    return extraction
  }
)

export const approveProposal = createAsyncThunk(
  "proposals/approve",
  async (id: string) => {
    const { change } = await approveProposalRequest(id)
    return change
  }
)

export const rejectProposal = createAsyncThunk(
  "proposals/reject",
  async (id: string) => {
    const { change } = await rejectProposalRequest(id)
    return change
  }
)

export const approveExtraction = createAsyncThunk(
  "proposals/approveExtraction",
  async (extractionId: string) => {
    const result = await approveExtractionRequest(extractionId)
    return { extractionId, ...result }
  }
)

export const discardExtraction = createAsyncThunk(
  "proposals/discardExtraction",
  async (extractionId: string) => {
    await discardExtractionRequest(extractionId)
    return extractionId
  }
)

// ---------------------------------------------------------------- slice

const proposalsSlice = createSlice({
  name: "proposals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposals.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        proposalsAdapter.setAll(state, action.payload)
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to load proposals"
        toast.error("Failed to load proposals")
      })

      .addCase(extractProposals.pending, (state) => {
        state.extracting = true
      })
      .addCase(extractProposals.fulfilled, (state, action) => {
        state.extracting = false
        proposalsAdapter.upsertMany(state, action.payload.changes)
        const count = action.payload.changes.length
        toast.success(
          count === 0
            ? "Nothing actionable found in that text"
            : `${count} change${count === 1 ? "" : "s"} ready for review`
        )
      })
      .addCase(extractProposals.rejected, (state, action) => {
        state.extracting = false
        toast.error(action.error.message ?? "Extraction failed")
      })

      .addCase(approveProposal.fulfilled, (state, action) => {
        proposalsAdapter.upsertOne(state, action.payload)
        toast.success("Change applied")
      })
      .addCase(approveProposal.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Could not apply this change")
      })

      .addCase(rejectProposal.fulfilled, (state, action) => {
        proposalsAdapter.upsertOne(state, action.payload)
      })
      .addCase(rejectProposal.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Could not reject this change")
      })

      .addCase(approveExtraction.fulfilled, (_state, action) => {
        const { applied, failed } = action.payload
        if (failed.length === 0) {
          toast.success(`Applied ${applied} change${applied === 1 ? "" : "s"}`)
        } else {
          // Partial success is the normal case for a rep with mixed entities,
          // so name what did not land rather than just failing the batch.
          toast.warning(
            `Applied ${applied}, skipped ${failed.length}: ${failed
              .map((f) => f.label)
              .join(", ")}`
          )
        }
      })
      .addCase(approveExtraction.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Could not apply these changes")
      })

      .addCase(discardExtraction.fulfilled, (state, action) => {
        const ids = Object.values(state.entities)
          .filter((c) => c && c.extractionId === action.payload)
          .map((c) => c!.id)
        proposalsAdapter.removeMany(state, ids)
        toast.success("Extraction discarded")
      })
  },
})

export default proposalsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllProposals,
  selectById: selectProposalById,
  selectEntities: selectProposalEntities,
} = proposalsAdapter.getSelectors<RootState>((state) => state.proposals)

export const selectProposalsStatus = (state: RootState) => state.proposals.status
export const selectProposalsError = (state: RootState) => state.proposals.error
export const selectIsExtracting = (state: RootState) => state.proposals.extracting

export const selectPendingProposals = createSelector(
  [selectAllProposals],
  (proposals) => proposals.filter((p) => p.status === "pending")
)

export const selectPendingCount = createSelector(
  [selectPendingProposals],
  (pending) => pending.length
)

/** Pending changes grouped by the paste they came from, newest batch first. */
export const selectPendingByExtraction = createSelector(
  [selectPendingProposals],
  (pending) => {
    const groups = new Map<string, ProposedChange[]>()
    for (const change of pending) {
      const list = groups.get(change.extractionId) ?? []
      list.push(change)
      groups.set(change.extractionId, list)
    }
    return [...groups.entries()].map(([extractionId, changes]) => ({
      extractionId,
      summary: changes[0]?.extraction?.summary ?? "",
      sourceLabel: changes[0]?.extraction?.sourceLabel ?? "",
      createdAt: changes[0]?.extraction?.createdAt ?? changes[0]!.createdAt,
      changes,
    }))
  }
)
