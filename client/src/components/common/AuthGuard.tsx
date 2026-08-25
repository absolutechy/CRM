import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { useAppSelector } from "@/store/hooks"
import { selectAuthStatus } from "@/store/authSlice"
import { Spinner } from "../ui/spinner"

/** Keeps protected routes behind a session; shows a splash while bootstrapping. */
const AuthGuard = ({ children }: { children: ReactNode }) => {
  const status = useAppSelector(selectAuthStatus)
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Spinner className="size-10" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default AuthGuard
