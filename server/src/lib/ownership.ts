import type { UserRole } from "@prisma/client"

import { ApiError } from "@/lib/http"

export interface AuthUser {
  id: string
  role: UserRole
}

export const isAdmin = (user: AuthUser) => user.role === "admin"
export const isManager = (user: AuthUser) => user.role === "manager"
export const isRep = (user: AuthUser) => user.role === "rep"

/** Admins and managers see all records; reps see only their own. */
export const canAccessAllRecords = (user: AuthUser) =>
  isAdmin(user) || isManager(user)

/** Returns an ownership filter for the given owner field. */
export const ownershipFilter = (
  user: AuthUser,
  ownerField = "ownerId"
): Record<string, string> | undefined => {
  if (canAccessAllRecords(user)) return undefined
  return { [ownerField]: user.id }
}

/** Throws 403 if a rep tries to access a record they do not own. */
export const assertOwnsRecord = (
  user: AuthUser,
  ownerId: string | null | undefined
) => {
  if (canAccessAllRecords(user)) return
  if (ownerId !== user.id) {
    throw ApiError.forbidden("You do not have access to this record")
  }
}
