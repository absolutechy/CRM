import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Task, TaskStatus } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_TASKS } from "./seed"

const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

export type TaskDraft = Omit<Task, "id" | "createdAt">

const tasksSlice = createSlice({
  name: "tasks",
  initialState: tasksAdapter.setAll(tasksAdapter.getInitialState(), SEED_TASKS),
  reducers: {
    taskAdded: {
      reducer: tasksAdapter.addOne,
      prepare: (draft: TaskDraft) => ({
        payload: {
          ...draft,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        } satisfies Task,
      }),
    },
    taskUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Task> }>
    ) => {
      tasksAdapter.updateOne(state, action.payload)
    },
    /** Kanban drag-and-drop. Moving to `done` stamps `completedAt`. */
    taskStatusChanged: (
      state,
      action: PayloadAction<{ id: string; status: TaskStatus }>
    ) => {
      const task = state.entities[action.payload.id]
      if (!task) return
      task.status = action.payload.status
      task.completedAt =
        action.payload.status === "done" ? new Date().toISOString() : undefined
    },
    taskRemoved: tasksAdapter.removeOne,
  },
})

export const { taskAdded, taskUpdated, taskStatusChanged, taskRemoved } =
  tasksSlice.actions

export default tasksSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllTasks, selectById: selectTaskById } =
  tasksAdapter.getSelectors<RootState>((state) => state.tasks)

export const selectTasksByStatus = createSelector([selectAllTasks], (tasks) => ({
  backlog: tasks.filter((t) => t.status === "backlog"),
  todo: tasks.filter((t) => t.status === "todo"),
  "in-progress": tasks.filter((t) => t.status === "in-progress"),
  done: tasks.filter((t) => t.status === "done"),
}))

export const selectTasksByContactId = createSelector(
  [selectAllTasks, (_: RootState, contactId: string) => contactId],
  (tasks, contactId) => tasks.filter((t) => t.contactId === contactId)
)

export const selectTasksByDealId = createSelector(
  [selectAllTasks, (_: RootState, dealId: string) => dealId],
  (tasks, dealId) => tasks.filter((t) => t.dealId === dealId)
)

/** Counters for the dashboard: open work and anything past its due date. */
export const selectTaskSummary = createSelector([selectAllTasks], (tasks) => {
  const open = tasks.filter((t) => t.status !== "done")
  const now = Date.now()
  return {
    total: tasks.length,
    open: open.length,
    done: tasks.length - open.length,
    overdue: open.filter(
      (t) => t.dueDate && new Date(t.dueDate).getTime() < now
    ).length,
    unassigned: open.filter((t) => !t.assigneeId).length,
  }
})
