# Authentication Bugs & Fixes

A record of two related authentication bugs we hit while testing the CRM login/logout flow.

---

## Bug 1 — Logout left the UI fully usable

### Symptom
Clicking **Sign out** called the logout API successfully (the server cleared the httpOnly refresh cookie and revoked the token), but the dashboard stayed open and the user could still use every part of the app. Only a manual page refresh redirected to the login screen.

### Root cause
The server returns `204 No Content` for logout. In `client/src/services/api.ts`, the response handler did:

```ts
const parsed = bodyText ? (JSON.parse(bodyText) as Envelope<T>) : null
return parsed.data as T
```

For a `204` response, `bodyText` was `""`, so `parsed` was `null`. The `return parsed.data as T` line then threw a TypeError.

That error made the `logout` thunk **reject**, so:
1. `logout.fulfilled` in the auth slice never fired.
2. The auth state stayed `status: "authenticated"` with the user still in Redux.
3. `AuthGuard` did not redirect to `/login`.
4. The explicit `navigate("/login")` in `AppHeader` was also skipped because the awaited thunk threw.

### Fix
- Updated `apiRequest` to treat an empty or `204` response as a successful `undefined` result instead of crashing.
- Also wrapped the body parse in a `try/catch` so malformed non-JSON responses don't blow up the app.
- Made the `logout` thunk swallow network/API errors and always clear the local session, so the UI logs out even if the server call fails:

```ts
export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutRequest()
  } catch {
    // Swallow — local logout must still happen.
  } finally {
    setAccessToken(null)
  }
})
```

### Files changed
- `client/src/services/api.ts`
- `client/src/store/authSlice.ts`

---

## Bug 2 — Login blocked by "Too many authentication attempts"

### Symptom
Attempting to log in returned this error, even on the first try:

```json
{
  "success": false,
  "data": null,
  "message": "Too many authentication attempts, please try again shortly"
}
```

### Root cause
The tight rate limiter (`20 requests / 15 min`) was mounted on the entire `/api/auth` router in `server/src/app.ts`:

```ts
app.use("/api/auth", authLimiter, authRouter)
```

That meant `/me`, `/refresh`, `/logout`, `/login`, and `/register` all shared the same small budget.

On every app boot, `App.tsx` dispatches `fetchMe()`:
1. `GET /api/auth/me` with no access token → `401`
2. The api wrapper sees `401`, then auto-retries with `POST /api/auth/refresh` (which also fails because the refresh cookie was not yet set)

Each page reload consumed 2 requests from the limiter. After a few reloads or initial load cycles, the budget was gone, so the actual `POST /api/auth/login` was rejected.

### Fix
Moved the tight limiter out of `app.ts` and attached it **only** to the brute-force targets in `server/src/routes/auth.ts`: `POST /login` and `POST /register`.

Other auth routes (`/me`, `/refresh`, `/logout`) still share the much looser global `/api` limiter (`1000 / 15 min`).

### Files changed
- `server/src/app.ts`
- `server/src/routes/auth.ts`

---

## Lessons / takeaways

1. **Always handle `204 No Content` in a generic fetch wrapper** — assuming every response has a JSON envelope will eventually break on endpoints that return an empty body.
2. **Make logout a "best effort" local operation** — even if the server call fails, the client must not stay "logged in".
3. **Scope rate limiters narrowly** — protect credential endpoints, but don't let bootstrap/session routes share their budget.
4. **If the limiter still blocks after the fix**, restart the server; the counter is in-memory and will reset on restart.
