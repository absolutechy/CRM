/**
 * Shared fetch wrapper for the backend API.
 *
 * - Attaches the Bearer access token from the auth store.
 * - Unwraps the ApiEnvelope ({ success, data, message }) and returns `data`.
 * - On 401, performs a single-flight refresh via the httpOnly refresh cookie,
 *   then retries the original request once. Concurrent 401s share one refresh.
 */

export class ApiRequestError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.details = details
  }
}

interface Envelope<T> {
  success: boolean
  data: T | null
  message: string
  errors?: unknown
}

/**
 * API base URL. In dev the Vite proxy forwards `/api` to the Express server.
 * In production, set `VITE_API_URL` to your deployed backend origin (e.g.
 * https://crm-api.example.com) — it must NOT include a trailing slash.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  ""
) || "/api"

let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

export const apiBaseUrl = BASE_URL

// ------------------------------------------------------------------ refresh

let refreshPromise: Promise<boolean> | null = null

/** POST /api/auth/refresh using the cookie; returns true when a new access
 *  token was issued. Single-flight: concurrent callers share one request. */
const refreshAccessToken = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
        if (!res.ok) return false
        const body = (await res.json()) as Envelope<{ accessToken: string }>
        if (!body.success || !body.data) return false
        setAccessToken(body.data.accessToken)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

// --------------------------------------------------------------------- core

interface RequestOptions {
  method?: string
  body?: object
  /** Skip the 401 auto-refresh retry (used by the refresh call itself). */
  skipAuthRetry?: boolean
}

const toQueryString = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      search.set(key, value.join(","))
    } else {
      search.set(key, String(value))
    }
  }
  return search.toString()
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = "GET", body, skipAuthRetry = false } = options

  const headers: Record<string, string> = {}
  if (body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json"
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let url = `${BASE_URL}${path}`
  if (method === "GET" && body) {
    const query = toQueryString(body as Record<string, unknown>)
    if (query) url += `?${query}`
  }

  const doFetch = () =>
    fetch(url, {
      method,
      headers,
      credentials: "include",
      ...(method !== "GET" && body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    })

  let res = await doFetch()

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
      res = await doFetch()
    } else {
      // Refresh failed — the session is over. The auth slice listens for this.
      window.dispatchEvent(new Event("auth:expired"))
      throw new ApiRequestError("Session expired", 401)
    }
  }

  const bodyText = await res.text()
  let parsed: Envelope<T> | null = null
  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText) as Envelope<T>
    } catch {
      // Non-JSON body (e.g. a proxy error page) — fall through to the error path.
      parsed = null
    }
  }

  if (!res.ok) {
    throw new ApiRequestError(
      parsed?.message ?? `Request failed (${res.status})`,
      res.status,
      parsed?.errors
    )
  }

  // 204 No Content (e.g. logout) — nothing to unwrap.
  if (!parsed) {
    return undefined as T
  }

  if (!parsed.success) {
    throw new ApiRequestError(parsed.message, res.status, parsed.errors)
  }

  return parsed.data as T
}
