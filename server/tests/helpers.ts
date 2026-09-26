import type { Express } from "express"
import type { UserRole } from "@prisma/client"
import request from "supertest"

import { createApp } from "@/app"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export const PASSWORD = "TestPassword123!"

export interface Actor {
  id: string
  email: string
  role: UserRole
  /** Bearer token for Authorization headers. */
  token: string
}

/** One app instance for the whole suite; createApp has no per-test state. */
let cached: Express | undefined
export const app = (): Express => (cached ??= createApp())

/**
 * Creates a user straight through Prisma and logs them in. Registration goes
 * through an admin-only endpoint, so seeding the first admin via the API would
 * be circular.
 */
export const makeActor = async (
  role: UserRole,
  label = role
): Promise<Actor> => {
  const email =
    `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`.toLowerCase()
  const user = await prisma.user.create({
    data: {
      name: `Test ${label}`,
      email,
      passwordHash: await hashPassword(PASSWORD),
      role,
    },
  })

  const res = await request(app())
    .post("/api/auth/login")
    .send({ email, password: PASSWORD })

  if (res.status !== 200) {
    throw new Error(
      `login failed for ${role}: ${res.status} ${JSON.stringify(res.body)}`
    )
  }

  return { id: user.id, email, role, token: res.body.data.accessToken }
}

/** Convenience wrappers so tests read as "as(rep).get(...)". */
export const as = (actor: Actor) => ({
  get: (path: string) =>
    request(app()).get(path).set("Authorization", `Bearer ${actor.token}`),
  post: (path: string) =>
    request(app()).post(path).set("Authorization", `Bearer ${actor.token}`),
  patch: (path: string) =>
    request(app()).patch(path).set("Authorization", `Bearer ${actor.token}`),
  delete: (path: string) =>
    request(app()).delete(path).set("Authorization", `Bearer ${actor.token}`),
})

export const anonymous = () => ({
  get: (path: string) => request(app()).get(path),
  post: (path: string) => request(app()).post(path),
})
