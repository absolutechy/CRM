import { createHash, randomBytes } from "node:crypto"

import { env } from "@/config/env"
import { prisma } from "./prisma"

/** Opaque token sent to the client; only its SHA-256 hash is stored. */
export const generateRefreshToken = (): string => randomBytes(32).toString("hex")

export const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex")

const refreshTokenTtlMs = (): number => {
  // JWT_ACCESS_TTL strings are jsonwebtoken-style ("15m", "7d"). Only the
  // refresh TTL matters here; default to 7 days when parsing fails.
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_TTL)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const amount = match[1]
  const unit = match[2]
  if (!amount || !unit) return 7 * 24 * 60 * 60 * 1000
  const value = Number(amount)
  const msPerUnit: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  return value * (msPerUnit[unit] ?? 86_400_000)
}

export const createRefreshToken = async (userId: string): Promise<string> => {
  const token = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(token),
      userId,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs()),
    },
  })
  return token
}

/**
 * Rotates a presented refresh token. Returns the new opaque token and the
 * owning user id, or null when the presented token is unknown or expired.
 * When a *revoked* token is presented, the whole session family is revoked
 * (reuse detection).
 */
export const rotateRefreshToken = async (
  token: string
): Promise<{ refreshToken: string; userId: string } | null> => {
  const hash = hashRefreshToken(token)
  const stored = await prisma.refreshToken.findUnique({
    where: { token: hash },
  })

  if (!stored) return null

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of a rotated token — revoke every refresh token this user holds.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId },
      data: { revokedAt: new Date() },
    })
    return null
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  const refreshToken = await createRefreshToken(stored.userId)
  return { refreshToken, userId: stored.userId }
}

/** Revokes a single presented token (logout). */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { token: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
