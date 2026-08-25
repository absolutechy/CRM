import type { UserRole } from "@prisma/client"

export {}

declare global {
  namespace Express {
    interface Request {
      /** Populated by `authenticate`. */
      user?: {
        id: string
        role: UserRole
      }
    }
  }
}
