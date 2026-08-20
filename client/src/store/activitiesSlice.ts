import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Activity, ActivityStatus } from "@/types/crm"
import { isInteractionType } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_ACTIVITIES } from "./seed"

const activitiesAdapter = createEntityAdapter<Activity>({
  // Newest first — the detail timeline reads top-down.
  sortComparer: (a, b) => b.at.localeCompare(a.at),
})

export type ActivityDraft = Omit<
  Activity,
  "id" | "at" | "status" | "companyId"
> & {
  at?: string
  status?: ActivityStatus
  companyId?: string | null
}

const activitiesSlice = createSlice({
  name: "activities",
  initialState: activitiesAdapter.setAll(
    activitiesAdapter.getInitialState(),
    SEED_ACTIVITIES
  ),
  reducers: {
    activityLogged: {
      reducer: activitiesAdapter.addOne,
      prepare: (draft: ActivityDraft) => ({
        payload: {
          ...draft,
          id: nanoid(),
          companyId: draft.companyId ?? null,
          status: draft.status ?? "logged",
          // Planned items sort by when they're due; logged ones by now.
          at: draft.at ?? draft.scheduledAt ?? new Date().toISOString(),
        } satisfies Activity,
      }),
    },
    activityUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Activity> }>
    ) => {
      activitiesAdapter.updateOne(state, action.payload)
    },
    activityRemoved: activitiesAdapter.removeOne,
  },
})

export const { activityLogged, activityUpdated, activityRemoved } =
  activitiesSlice.actions

export default activitiesSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllActivities, selectById: selectActivityById } =
  activitiesAdapter.getSelectors<RootState>((state) => state.activities)

export const selectActivitiesByContactId = createSelector(
  [selectAllActivities, (_: RootState, contactId: string) => contactId],
  (activities, contactId) => activities.filter((a) => a.contactId === contactId)
)

/** Account-level rollup: every interaction across all contacts at a company. */
export const selectActivitiesByCompanyId = createSelector(
  [selectAllActivities, (_: RootState, companyId: string) => companyId],
  (activities, companyId) => activities.filter((a) => a.companyId === companyId)
)

export const selectActivitiesByLeadId = createSelector(
  [selectAllActivities, (_: RootState, leadId: string) => leadId],
  (activities, leadId) => activities.filter((a) => a.leadId === leadId)
)

/** Logged interactions only — excludes `created` / `status_change` noise. */
export const selectInteractions = createSelector(
  [selectAllActivities],
  (activities) => activities.filter((a) => isInteractionType(a.type))
)

/** Distinct actors, for the global feed's team filter. */
export const selectActors = createSelector([selectAllActivities], (activities) =>
  Array.from(new Set(activities.map((a) => a.actor))).sort()
)
