import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit"

import type { User } from "@/types/crm"
import type { RootState } from "./index"
import { apiRequest } from "@/services/api"

const usersAdapter = createEntityAdapter<User>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

type UsersStatus = "idle" | "loading" | "succeeded" | "failed"

interface UsersState {
  status: UsersStatus
  error: string | null
}

const initialState = usersAdapter.getInitialState<UsersState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const { users } = await apiRequest<{ users: User[] }>("/users")
  return users
})

// ---------------------------------------------------------------- slice

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        usersAdapter.setAll(state, action.payload)
        state.status = "succeeded"
        state.error = null
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load users"
      })
  },
})

export default usersSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectEntities: selectUserEntities,
} = usersAdapter.getSelectors<RootState>((state) => state.users)

export const selectUsersStatus = (state: RootState) => state.users.status
export const selectUsersError = (state: RootState) => state.users.error

/** Name lookup for table cells and assignment dropdowns. */
export const selectUserNameById = createSelector(
  [selectUserEntities, (_: RootState, id: string | null | undefined) => id],
  (entities, id) => (id ? (entities[id]?.name ?? "Unassigned") : "Unassigned")
)
