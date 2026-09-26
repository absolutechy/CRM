import { useMemo } from "react"

import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/authSlice"

/**
 * Mirrors the server's access model in one place, so the UI never offers an
 * action the API will refuse.
 *
 * The rules are enforced server-side regardless — see server/src/routes and
 * server/tests/permissions.test.ts. This exists to keep the interface honest,
 * not to secure anything.
 */
export interface Permissions {
  /**
   * Contacts, companies and activities are shared across the workspace and
   * carry no owner, so everyone reads them but only admins and managers may
   * create, edit or delete.
   */
  canWriteSharedRecords: boolean
  /**
   * Automation rules fire for the whole organisation, so only admins and
   * managers may change them. The API still allows reps to read rules; the UI
   * hides the section because there is nothing there they can act on.
   */
  canManageAutomations: boolean
  isAdmin: boolean
  isManager: boolean
  isRep: boolean
}

export const usePermissions = (): Permissions => {
  const user = useAppSelector(selectCurrentUser)

  return useMemo(() => {
    const role = user?.role
    const privileged = role === "admin" || role === "manager"

    return {
      canWriteSharedRecords: privileged,
      canManageAutomations: privileged,
      isAdmin: role === "admin",
      isManager: role === "manager",
      isRep: role === "rep",
    }
  }, [user?.role])
}

export default usePermissions
