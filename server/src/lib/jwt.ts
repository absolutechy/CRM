import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload } from "jose"

import { env } from "@/config/env"
import type { UserRole } from "@prisma/client"

export interface AccessTokenPayload extends JWTPayload {
  /** User id. */
  sub: string
  role: UserRole
  type: "access"
}

const encoder = new TextEncoder()

const accessSecret = () => encoder.encode(env.JWT_ACCESS_SECRET)

export const signAccessToken = (payload: AccessTokenPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret())

/** Returns the payload, or null when the token is invalid or expired. */
export const verifyAccessToken = async (
  token: string
): Promise<AccessTokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), {
      algorithms: ["HS256"],
    })
    if (payload.type !== "access" || typeof payload.sub !== "string") {
      return null
    }
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      type: "access",
    }
  } catch {
    return null
  }
}
