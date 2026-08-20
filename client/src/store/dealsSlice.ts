import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Deal, DealStage } from "@/types/crm"
import { isOpenStage } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_DEALS } from "./seed"

const dealsAdapter = createEntityAdapter<Deal>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

export type DealDraft = Omit<Deal, "id" | "createdAt" | "updatedAt">

const dealsSlice = createSlice({
  name: "deals",
  initialState: dealsAdapter.setAll(dealsAdapter.getInitialState(), SEED_DEALS),
  reducers: {
    dealAdded: {
      reducer: dealsAdapter.addOne,
      prepare: (draft: DealDraft & { id?: string }) => {
        const now = new Date().toISOString()
        return {
          payload: {
            ...draft,
            id: draft.id ?? nanoid(),
            createdAt: now,
            updatedAt: now,
          } satisfies Deal,
        }
      },
    },
    dealUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Deal> }>
    ) => {
      dealsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    /** Board drag-and-drop: moving to a closed stage stamps `closedAt`. */
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
    dealRemoved: dealsAdapter.removeOne,
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
