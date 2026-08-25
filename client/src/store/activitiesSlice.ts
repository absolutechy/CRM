import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Activity, ActivityStatus } from "@/types/crm"
import { isInteractionType } from "@/types/crm"
import type { RootState } from "./index"
import {
  createActivity as createActivityRequest,
  deleteActivity as deleteActivityRequest,
  getActivities as getActivitiesRequest,
  updateActivity as updateActivityRequest,
  type ActivitiesFilters,
} from "@/services/activitiesService"

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

type ActivitiesStatus = "idle" | "loading" | "succeeded" | "failed"

interface ActivitiesState {
  status: ActivitiesStatus
  error: string | null
}

const initialState = activitiesAdapter.getInitialState<ActivitiesState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchActivities = createAsyncThunk(
  "activities/fetchActivities",
  async (filters: ActivitiesFilters = {}) => {
    return getActivitiesRequest(filters)
  }
)

export const createActivity = createAsyncThunk(
  "activities/createActivity",
  async (draft: Partial<Activity>) => {
    const { activity } = await createActivityRequest(draft)
    return activity
  }
)

export const updateActivity = createAsyncThunk(
  "activities/updateActivity",
  async ({ id, changes }: { id: string; changes: Partial<Activity> }) => {
    const { activity } = await updateActivityRequest(id, changes)
    return activity
  }
)

export const deleteActivity = createAsyncThunk(
  "activities/deleteActivity",
  async (id: string) => {
    await deleteActivityRequest(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    /** Local actions kept for compatibility (composer + lead conversion). */
    activityLogged: {
      reducer: activitiesAdapter.addOne,
      prepare: (draft: ActivityDraft) => ({
        payload: {
          ...draft,
          id: `local-${Date.now()}`,
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
  extraReducers: (builder) => {
    builder
      // fetchActivities
      .addCase(fetchActivities.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        activitiesAdapter.setAll(state, action.payload.activities)
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load activity"
        toast.error("Failed to load activity")
      })

      // createActivity
      .addCase(createActivity.fulfilled, (state, action) => {
        activitiesAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Interaction added to the timeline")
      })
      .addCase(createActivity.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to log interaction")
      })

      // updateActivity
      .addCase(updateActivity.fulfilled, (state, action) => {
        activitiesAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Interaction updated")
      })
      .addCase(updateActivity.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update interaction")
      })

      // deleteActivity
      .addCase(deleteActivity.fulfilled, (state, action) => {
        activitiesAdapter.removeOne(state, action.payload)
        toast.success("Interaction deleted")
      })
      .addCase(deleteActivity.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete interaction")
      })
  },
})

export const { activityLogged, activityUpdated, activityRemoved } =
  activitiesSlice.actions

export default activitiesSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllActivities,
  selectById: selectActivityById,
} = activitiesAdapter.getSelectors<RootState>((state) => state.activities)

export const selectActivitiesStatus = (state: RootState) => state.activities.status
export const selectActivitiesError = (state: RootState) => state.activities.error

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
export const selectActors = createSelector([selectAllActivities], (activities) => {
  const names = new Set<string>()
  for (const a of activities) {
    const actor = a.actor as unknown
    const name =
      typeof actor === "object" && actor !== null && "name" in actor
        ? String((actor as { name: string }).name)
        : String(actor ?? "")
    if (name) names.add(name)
  }
  return Array.from(names).sort()
})
