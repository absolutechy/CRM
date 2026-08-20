import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Company } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_COMPANIES } from "./seed"

const companiesAdapter = createEntityAdapter<Company>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

export type CompanyDraft = Omit<Company, "id" | "createdAt">

const companiesSlice = createSlice({
  name: "companies",
  initialState: companiesAdapter.setAll(
    companiesAdapter.getInitialState(),
    SEED_COMPANIES
  ),
  reducers: {
    companyAdded: {
      reducer: companiesAdapter.addOne,
      // `id` may be supplied so lead conversion can link the contact to the
      // account it creates in the same handler.
      prepare: (draft: CompanyDraft & { id?: string }) => ({
        payload: {
          ...draft,
          id: draft.id ?? nanoid(),
          createdAt: new Date().toISOString(),
        } satisfies Company,
      }),
    },
    companyUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Company> }>
    ) => {
      companiesAdapter.updateOne(state, action.payload)
    },
    companyRemoved: companiesAdapter.removeOne,
  },
})

export const { companyAdded, companyUpdated, companyRemoved } =
  companiesSlice.actions

export default companiesSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllCompanies,
  selectById: selectCompanyById,
  selectEntities: selectCompanyEntities,
} = companiesAdapter.getSelectors<RootState>((state) => state.companies)

/** Convenience for table cells that only need a display name from an FK. */
export const selectCompanyNameById = createSelector(
  [selectCompanyEntities, (_: RootState, id: string | null) => id],
  (entities, id) => (id ? (entities[id]?.name ?? "—") : "—")
)
