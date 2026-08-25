import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Company } from "@/types/crm"
import type { RootState } from "./index"
import {
  createCompany as createCompanyRequest,
  deleteCompany as deleteCompanyRequest,
  getCompanies as getCompaniesRequest,
  getCompany as getCompanyRequest,
  updateCompany as updateCompanyRequest,
  type CompaniesFilters,
} from "@/services/companiesService"

const companiesAdapter = createEntityAdapter<Company>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

export type CompanyDraft = Omit<Company, "id" | "createdAt">

type CompaniesStatus = "idle" | "loading" | "succeeded" | "failed"

interface CompaniesState {
  status: CompaniesStatus
  error: string | null
}

const initialState = companiesAdapter.getInitialState<CompaniesState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchCompanies = createAsyncThunk(
  "companies/fetchCompanies",
  async (filters: CompaniesFilters = {}) => {
    return getCompaniesRequest(filters)
  }
)

export const fetchCompany = createAsyncThunk(
  "companies/fetchCompany",
  async (id: string) => {
    const { company } = await getCompanyRequest(id)
    return company
  }
)

export const createCompany = createAsyncThunk(
  "companies/createCompany",
  async (draft: Partial<Company>) => {
    const { company } = await createCompanyRequest(draft)
    return company
  }
)

export const updateCompany = createAsyncThunk(
  "companies/updateCompany",
  async ({ id, changes }: { id: string; changes: Partial<Company> }) => {
    const { company } = await updateCompanyRequest(id, changes)
    return company
  }
)

export const deleteCompany = createAsyncThunk(
  "companies/deleteCompany",
  async (id: string) => {
    await deleteCompanyRequest(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const companiesSlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    companyAdded: companiesAdapter.addOne,
    companyUpdated: companiesAdapter.updateOne,
    companyRemoved: companiesAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      // fetchCompanies
      .addCase(fetchCompanies.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        companiesAdapter.setAll(state, action.payload.companies)
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load companies"
        toast.error("Failed to load companies")
      })

      // fetchCompany
      .addCase(fetchCompany.fulfilled, (state, action) => {
        companiesAdapter.upsertOne(state, action.payload)
      })

      // createCompany
      .addCase(createCompany.fulfilled, (state, action) => {
        companiesAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.name} added as a company`)
      })
      .addCase(createCompany.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create company")
      })

      // updateCompany
      .addCase(updateCompany.fulfilled, (state, action) => {
        companiesAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.name} updated`)
      })
      .addCase(updateCompany.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update company")
      })

      // deleteCompany
      .addCase(deleteCompany.fulfilled, (state, action) => {
        companiesAdapter.removeOne(state, action.payload)
        toast.success("Company deleted")
      })
      .addCase(deleteCompany.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete company")
      })
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

export const selectCompaniesStatus = (state: RootState) => state.companies.status
export const selectCompaniesError = (state: RootState) => state.companies.error

/** Convenience for table cells that only need a display name from an FK. */
export const selectCompanyNameById = createSelector(
  [selectCompanyEntities, (_: RootState, id: string | null) => id],
  (entities, id) => (id ? (entities[id]?.name ?? "—") : "—")
)
