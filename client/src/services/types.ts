/**
 * Shared shape for every backend-bound call.
 *
 * All of these services are stubs today — the CRM has no backend yet. Each
 * returns `{ ok: false, pending: true }` so callers can render an explicit
 * "pending backend" state instead of silently doing nothing or faking success.
 */
export interface ServiceResult<T = void> {
  ok: boolean
  /** True when the operation needs a backend that isn't connected yet. */
  pending: boolean
  message: string
  data?: T
}

export const pendingBackend = <T = void>(message: string): ServiceResult<T> => ({
  ok: false,
  pending: true,
  message,
})
