import type { User, UserRole } from "@/types/crm"
import { apiRequest } from "./api"

interface AuthResponse {
  user: User
  accessToken: string
}

export const login = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  })

export const register = (input: {
  name: string
  email: string
  password: string
  role: UserRole
}) =>
  apiRequest<{ user: User }>("/auth/register", {
    method: "POST",
    body: input,
  })

export const logout = () => apiRequest<void>("/auth/logout", { method: "POST" })

export const fetchMe = () => apiRequest<{ user: User }>("/auth/me")
