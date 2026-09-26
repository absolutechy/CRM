import { expect, it } from "vitest"

import { prisma, PRISMA_SCHEMA } from "@/lib/prisma"
import { makeActor } from "./helpers"

/**
 * Guards the mistake that let an earlier run write test users into the `crm`
 * development schema: search_path isolated raw SQL, but Prisma's ORM queries
 * are qualified by the adapter's schema and went to `crm` regardless.
 */
it("the ORM is pinned to the test schema, not crm", async () => {
  expect(PRISMA_SCHEMA).toBe("crm_test")

  await makeActor("rep", "isolationprobe")

  const [inTest] = await prisma.$queryRawUnsafe<{ n: number }[]>(
    "select count(*)::int as n from crm_test.users where email like '%@test.local'"
  )
  // On a fresh CI database the `crm` schema does not exist at all, which is
  // itself proof of isolation — so probe for the table before counting.
  const [devTable] = await prisma.$queryRawUnsafe<{ t: string | null }[]>(
    "select to_regclass('crm.users')::text as t"
  )
  const inDev = devTable?.t
    ? (
        await prisma.$queryRawUnsafe<{ n: number }[]>(
          "select count(*)::int as n from crm.users where email like '%@test.local'"
        )
      )[0]
    : { n: 0 }

  expect(inTest!.n, "actors must land in crm_test").toBeGreaterThan(0)
  expect(inDev!.n, "nothing may leak into the crm dev schema").toBe(0)
})
