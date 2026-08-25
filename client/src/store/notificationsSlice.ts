import { createAsyncThunk, createEntityAdapter, createSlice } from "@reduxjs/toolkit"

import type { RootState } from "./index"
import { apiRequest } from "@/services/api"

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

const notificationsAdapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

interface NotificationsState {
  unread: number
}

const initialState = notificationsAdapter.getInitialState<NotificationsState>({
  unread: 0,
})

// ---------------------------------------------------------------- thunks

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async () => {
    const { notifications } = await apiRequest<{ notifications: Notification[] }>(
      "/notifications"
    )
    return notifications
  }
)

export const fetchUnreadCount = createAsyncThunk(
  "notifications/unreadCount",
  async () => {
    const { count } = await apiRequest<{ count: number }>(
      "/notifications/unread-count"
    )
    return count
  }
)

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    const { notification } = await apiRequest<{ notification: Notification }>(
      `/notifications/${id}/read`,
      { method: "PATCH" }
    )
    return notification
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    await apiRequest<void>("/notifications/read-all", { method: "POST" })
  }
)

// ---------------------------------------------------------------- slice

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        notificationsAdapter.setAll(state, action.payload)
        state.unread = action.payload.filter((n) => !n.readAt).length
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        notificationsAdapter.upsertOne(state, action.payload)
        state.unread = Math.max(0, state.unread - 1)
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        const all = Object.values(state.entities)
        for (const n of all) {
          if (n && !n.readAt) {
            state.entities[n.id] = { ...n, readAt: new Date().toISOString() }
          }
        }
        state.unread = 0
      })
  },
})

export default notificationsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
} = notificationsAdapter.getSelectors<RootState>(
  (state) => state.notifications
)

export const selectUnreadCount = (state: RootState) => state.notifications.unread
