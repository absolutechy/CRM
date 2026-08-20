import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

import { isProd } from "@/config/env"
import { ApiError } from "@/lib/http"
import { logger } from "@/lib/logger"

/** Prisma error codes worth translating into something a client can act on. */
const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "That value is already taken" },
  P2003: { status: 400, message: "Related record does not exist" },
  P2025: { status: 404, message: "Record not found" },
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `No route matches ${req.method} ${req.originalUrl}`,
  })
}

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  // Express only treats this as an error handler if it takes four arguments.
  _next: NextFunction
) => {
  // Validation errors carry field-level detail worth returning.
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      message: "Validation failed",
      errors: error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    })
    return
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      data: null,
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    })
    return
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : undefined

  if (code && PRISMA_STATUS[code]) {
    const mapped = PRISMA_STATUS[code]
    res.status(mapped.status).json({
      success: false,
      data: null,
      message: mapped.message,
    })
    return
  }

  logger.error("Unhandled error", {
    error: error instanceof Error ? error.stack : error,
  })

  // Never leak internals in production.
  res.status(500).json({
    success: false,
    data: null,
    message: isProd
      ? "Something went wrong"
      : error instanceof Error
        ? error.message
        : "Unknown error",
  })
}
