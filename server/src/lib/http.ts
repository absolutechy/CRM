import type { Response } from "express"

/**
 * Every response uses the envelope the frontend expects, so the client can
 * unwrap it once in a shared fetch helper instead of per call site.
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  message: string
  pagination?: Pagination
}

export const ok = <T>(
  res: Response,
  data: T,
  message = "OK",
  pagination?: Pagination
) =>
  res.status(200).json({
    success: true,
    data,
    message,
    ...(pagination ? { pagination } : {}),
  } satisfies ApiEnvelope<T>)

export const created = <T>(res: Response, data: T, message = "Created") =>
  res.status(201).json({ success: true, data, message } satisfies ApiEnvelope<T>)

export const noContent = (res: Response) => res.status(204).send()

export const paginate = (
  page: number,
  pageSize: number,
  total: number
): Pagination => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
})

/**
 * Errors thrown anywhere in a handler are caught by the error middleware and
 * rendered into the same envelope.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }

  static badRequest = (message = "Bad request", details?: unknown) =>
    new ApiError(400, message, details)

  static unauthorized = (message = "Not authenticated") =>
    new ApiError(401, message)

  static forbidden = (message = "Not allowed") => new ApiError(403, message)

  static notFound = (message = "Not found") => new ApiError(404, message)

  static conflict = (message = "Conflict", details?: unknown) =>
    new ApiError(409, message, details)
}
