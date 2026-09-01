import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Task, TaskStatus } from "@/types/crm"
import type { RootState } from "./index"
import {
  changeTaskStatus as changeTaskStatusRequest,
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  getTask as getTaskRequest,
  getTasks as getTasksRequest,
  updateTask as updateTaskRequest,
  type TasksFilters,
} from "@/services/tasksService"

const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

export type TaskDraft = Omit<Task, "id" | "createdAt">

type TasksStatus = "idle" | "loading" | "succeeded" | "failed"

interface TasksState {
  status: TasksStatus
  error: string | null
}

const initialState = tasksAdapter.getInitialState<TasksState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (filters: TasksFilters | undefined = {}) => {
    return getTasksRequest(filters ?? {})
  }
)

export const fetchTask = createAsyncThunk(
  "tasks/fetchTask",
  async (id: string) => {
    const { task } = await getTaskRequest(id)
    return task
  }
)

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (draft: Partial<Task>) => {
    const { task } = await createTaskRequest(draft)
    return task
  }
)

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, changes }: { id: string; changes: Partial<Task> }) => {
    const { task } = await updateTaskRequest(id, changes)
    return task
  }
)

export const changeTaskStatus = createAsyncThunk(
  "tasks/changeTaskStatus",
  async ({ id, status }: { id: string; status: TaskStatus }) => {
    const { task } = await changeTaskStatusRequest(id, status)
    return task
  }
)

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id: string) => {
    await deleteTaskRequest(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    taskAdded: tasksAdapter.addOne,
    taskUpdated: tasksAdapter.updateOne,
    taskRemoved: tasksAdapter.removeOne,
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
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        tasksAdapter.setAll(state, action.payload.tasks)
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load tasks"
        toast.error("Failed to load tasks")
      })

      // fetchTask
      .addCase(fetchTask.fulfilled, (state, action) => {
        tasksAdapter.upsertOne(state, action.payload)
      })

      // createTask
      .addCase(createTask.fulfilled, (state, action) => {
        tasksAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Task created")
      })
      .addCase(createTask.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create task")
      })

      // updateTask
      .addCase(updateTask.fulfilled, (state, action) => {
        tasksAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Task updated")
      })
      .addCase(updateTask.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update task")
      })

      // changeTaskStatus
      .addCase(changeTaskStatus.fulfilled, (state, action) => {
        tasksAdapter.upsertOne(state, action.payload)
        toast.success("Task moved")
      })
      .addCase(changeTaskStatus.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to move task")
      })

      // deleteTask
      .addCase(deleteTask.fulfilled, (state, action) => {
        tasksAdapter.removeOne(state, action.payload)
        toast.success("Task deleted")
      })
      .addCase(deleteTask.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete task")
      })
  },
})

export const { taskAdded, taskUpdated, taskStatusChanged, taskRemoved } =
  tasksSlice.actions

export default tasksSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllTasks, selectById: selectTaskById } =
  tasksAdapter.getSelectors<RootState>((state) => state.tasks)

export const selectTasksStatus = (state: RootState) => state.tasks.status
export const selectTasksError = (state: RootState) => state.tasks.error

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
