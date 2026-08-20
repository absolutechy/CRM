import { createEntityAdapter, createSelector, createSlice } from "@reduxjs/toolkit"

import type { User } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_USERS } from "./seed"

const usersAdapter = createEntityAdapter<User>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const usersSlice = createSlice({
  name: "users",
  initialState: usersAdapter.setAll(usersAdapter.getInitialState(), SEED_USERS),
  reducers: {},
})

export default usersSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectEntities: selectUserEntities,
} = usersAdapter.getSelectors<RootState>((state) => state.users)

/** Name lookup for table cells and assignment dropdowns. */
export const selectUserNameById = createSelector(
  [selectUserEntities, (_: RootState, id: string | null | undefined) => id],
  (entities, id) => (id ? (entities[id]?.name ?? "Unassigned") : "Unassigned")
)

/** The signed-in user. Hardcoded until auth exists. */
export const CURRENT_USER_ID = "u1"

export const selectCurrentUser = (state: RootState) =>
  selectUserById(state, CURRENT_USER_ID)
