import { z } from "zod"
import { Prisma } from "@prisma/client"
import type { User } from "@prisma/client"

import { ApiError } from "@/lib/http"
import { signAccessToken } from "@/lib/jwt"
import { hashPassword, verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"
import {
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "@/lib/refreshToken"

const emailSchema = z.string().trim().email().toLowerCase()

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "manager", "rep"]).default("rep"),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

export type PublicUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "avatarColor" | "isActive"
>

const publicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarColor: user.avatarColor,
  isActive: user.isActive,
})

export const register = async (input: unknown) => {
  const { name, email, password, role } = registerSchema.parse(input)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw ApiError.conflict("An account with that email already exists")
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  })

  return { user: publicUser(user) }
}

export const login = async (input: unknown) => {
  const { email, password } = loginSchema.parse(input)

  const user = await prisma.user.findUnique({ where: { email } })
  // Same error for unknown email and wrong password — no user enumeration.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized("Invalid email or password")
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("Account is disabled")
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    type: "access",
  })
  const refreshToken = await createRefreshToken(user.id)

  return { user: publicUser(user), accessToken, refreshToken }
}

export const refresh = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw ApiError.unauthorized("No refresh token provided")
  }

  const rotated = await rotateRefreshToken(refreshToken)
  if (!rotated) {
    throw ApiError.unauthorized("Invalid or expired refresh token")
  }

  const user = await prisma.user.findUnique({
    where: { id: rotated.userId },
  })
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account is disabled")
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    type: "access",
  })
  return {
    user: publicUser(user),
    accessToken,
    refreshToken: rotated.refreshToken,
  }
}

export const logout = async (refreshToken: string | undefined) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }
}

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account is disabled")
  }
  return { user: publicUser(user) }
}

/** Map a Prisma unique-violation to a clean conflict response. */
export const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002"
