import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Deal, DealStage } from "@/types/crm"
import { isOpenStage } from "@/types/crm"
import type { RootState } from "./index"
import {
  changeDealStage as changeDealStageRequest,
  createDeal as createDealRequest,
  deleteDeal as deleteDealRequest,
  getDeal as getDealRequest,
  getDeals as getDealsRequest,
  updateDeal as updateDealRequest,
  type DealsFilters,
} from "@/services/dealsService"

const dealsAdapter = createEntityAdapter<Deal>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

export type DealDraft = Omit<Deal, "id" | "createdAt" | "updatedAt">

type DealsStatus = "idle" | "loading" | "succeeded" | "failed"

interface DealsState {
  status: DealsStatus
  error: string | null
}

const initialState = dealsAdapter.getInitialState<DealsState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchDeals = createAsyncThunk(
  "deals/fetchDeals",
  async (filters: DealsFilters = {}) => {
    return getDealsRequest(filters)
  }
)

export const fetchDeal = createAsyncThunk(
  "deals/fetchDeal",
  async (id: string) => {
    const { deal } = await getDealRequest(id)
    return deal
  }
)

export const createDeal = createAsyncThunk(
  "deals/createDeal",
  async (draft: Partial<Deal>) => {
    const { deal } = await createDealRequest(draft)
    return deal
  }
)

export const updateDeal = createAsyncThunk(
  "deals/updateDeal",
  async ({ id, changes }: { id: string; changes: Partial<Deal> }) => {
    const { deal } = await updateDealRequest(id, changes)
    return deal
  }
)

export const changeDealStage = createAsyncThunk(
  "deals/changeDealStage",
  async ({ id, stage }: { id: string; stage: DealStage }) => {
    const { deal } = await changeDealStageRequest(id, stage)
    return deal
  }
)

export const deleteDeal = createAsyncThunk(
  "deals/deleteDeal",
  async (id: string) => {
    await deleteDealRequest(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const dealsSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    dealAdded: dealsAdapter.addOne,
    dealUpdated: dealsAdapter.updateOne,
    dealRemoved: dealsAdapter.removeOne,
    dealStageChanged: (
      state,
      action: PayloadAction<{ id: string; stage: DealStage }>
    ) => {
      const deal = state.entities[action.payload.id]
      if (!deal) return
      deal.stage = action.payload.stage
      deal.updatedAt = new Date().toISOString()
      if (!isOpenStage(action.payload.stage)) {
        deal.closedAt = new Date().toISOString()
        deal.probability = action.payload.stage === "Won" ? 100 : 0
      } else {
        deal.closedAt = undefined
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDeals
      .addCase(fetchDeals.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        dealsAdapter.setAll(state, action.payload.deals)
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load deals"
        toast.error("Failed to load deals")
      })

      // fetchDeal
      .addCase(fetchDeal.fulfilled, (state, action) => {
        dealsAdapter.upsertOne(state, action.payload)
      })

      // createDeal
      .addCase(createDeal.fulfilled, (state, action) => {
        dealsAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.title} added as a deal`)
      })
      .addCase(createDeal.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create deal")
      })

      // updateDeal
      .addCase(updateDeal.fulfilled, (state, action) => {
        dealsAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.title} updated`)
      })
      .addCase(updateDeal.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update deal")
      })

      // changeDealStage
      .addCase(changeDealStage.fulfilled, (state, action) => {
        dealsAdapter.upsertOne(state, action.payload)
        toast.success(`Deal moved to ${action.payload.stage}`)
      })
      .addCase(changeDealStage.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to move deal")
      })

      // deleteDeal
      .addCase(deleteDeal.fulfilled, (state, action) => {
        dealsAdapter.removeOne(state, action.payload)
        toast.success("Deal deleted")
      })
      .addCase(deleteDeal.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete deal")
      })
  },
})

export const { dealAdded, dealUpdated, dealStageChanged, dealRemoved } =
  dealsSlice.actions

export default dealsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllDeals,
  selectById: selectDealById,
  selectEntities: selectDealEntities,
} = dealsAdapter.getSelectors<RootState>((state) => state.deals)

export const selectDealsStatus = (state: RootState) => state.deals.status
export const selectDealsError = (state: RootState) => state.deals.error

export const selectDealsByContactId = createSelector(
  [selectAllDeals, (_: RootState, contactId: string) => contactId],
  (deals, contactId) => deals.filter((d) => d.contactId === contactId)
)

export const selectDealsByCompanyId = createSelector(
  [selectAllDeals, (_: RootState, companyId: string) => companyId],
  (deals, companyId) => deals.filter((d) => d.companyId === companyId)
)

export const selectOpenDeals = createSelector([selectAllDeals], (deals) =>
  deals.filter((d) => isOpenStage(d.stage))
)

/** Headline pipeline figures for the dashboard and the deals page. */
export const selectPipelineSummary = createSelector([selectAllDeals], (deals) => {
  const open = deals.filter((d) => isOpenStage(d.stage))
  const won = deals.filter((d) => d.stage === "Won")
  const lost = deals.filter((d) => d.stage === "Lost")
  const sum = (list: Deal[]) => list.reduce((t, d) => t + d.amount, 0)
  const closed = won.length + lost.length

  return {
    openCount: open.length,
    openValue: sum(open),
    /** Open value discounted by each deal's win probability. */
    weightedValue: Math.round(
      open.reduce((t, d) => t + d.amount * (d.probability / 100), 0)
    ),
    wonCount: won.length,
    wonValue: sum(won),
    lostCount: lost.length,
    winRate: closed ? Math.round((won.length / closed) * 100) : 0,
    currency: deals[0]?.currency ?? "USD",
  }
})

/** Deal value per stage — feeds the dashboard pipeline chart. */
export const selectValueByStage = createSelector([selectAllDeals], (deals) => {
  const totals = new Map<DealStage, { count: number; value: number }>()
  for (const deal of deals) {
    const entry = totals.get(deal.stage) ?? { count: 0, value: 0 }
    entry.count += 1
    entry.value += deal.amount
    totals.set(deal.stage, entry)
  }
  return totals
})
