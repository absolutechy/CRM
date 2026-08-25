import type { ReactNode } from "react"
import { ShieldAlert } from "lucide-react"

import type { UserRole } from "@/types/crm"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/authSlice"

/** Renders children only for the given roles; otherwise a 403 notice. */
const RoleGuard = ({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children: ReactNode
}) => {
  const user = useAppSelector(selectCurrentUser)

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">You don&apos;t have access to this page</p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

export default RoleGuard
