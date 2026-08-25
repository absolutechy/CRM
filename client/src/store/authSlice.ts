import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import type { User } from "@/types/crm"
import { setAccessToken } from "@/services/api"
import {
  fetchMe as fetchMeRequest,
  login as loginRequest,
  logout as logoutRequest,
} from "@/services/authService"
import type { RootState } from "./index"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  user: User | null
  status: AuthStatus
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: "loading",
  error: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const { user, accessToken } = await loginRequest(email, password)
    setAccessToken(accessToken)
    return user
  }
)

export const logout = createAsyncThunk("auth/logout", async () => {
  // The server may already be unreachable or the token already revoked; the
  // client session is cleared regardless so the UI always logs out locally.
  try {
    await logoutRequest()
  } catch {
    // Swallow — local logout must still happen.
  } finally {
    setAccessToken(null)
  }
})

/**
 * Bootstrap: try to restore the session. `/auth/me` with a stored access
 * token works; a 401 triggers the wrapper's single-flight refresh and retry;
 * if that fails the user is unauthenticated.
 */
export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const { user } = await fetchMeRequest()
  return user
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionExpired: (state) => {
      state.user = null
      state.status = "unauthenticated"
      state.error = "Your session has expired. Please sign in again."
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = "authenticated"
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null
        state.status = "unauthenticated"
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Sign in failed. Check your email and password."
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = "unauthenticated"
        state.error = null
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = "authenticated"
        state.error = null
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.status = "unauthenticated"
        state.error = null
      })
  },
})

export const { sessionExpired } = authSlice.actions

export default authSlice.reducer

// ----------------------------------------------------------------- selectors

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectAuthStatus = (state: RootState) => state.auth.status
export const selectAuthError = (state: RootState) => state.auth.error
