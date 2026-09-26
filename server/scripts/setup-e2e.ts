import "dotenv/config"
import { spawnSync } from "node:child_process"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { Client } from "pg"

/**
 * Prepares the isolated schema the Playwright suite runs against: drops and
 * recreates it, pushes the Prisma schema, then seeds a fixed cast of users.
 *
 * Lives in the server package so it can use Prisma, bcrypt and pg directly;
 * the browser suite invokes it from its global setup.
 */
const SCHEMA = process.env.PRISMA_SCHEMA ?? "crm_e2e"

if (SCHEMA === "crm") {
  throw new Error("Refusing to run E2E setup against the `crm` schema")
}

export const E2E_PASSWORD = "E2EPassword123!"

const USERS = [
  { name: "E2E Admin", email: "e2e-admin@test.local", role: "admin" },
  { name: "E2E Manager", email: "e2e-manager@test.local", role: "manager" },
  { name: "E2E Rep A", email: "e2e-rep-a@test.local", role: "rep" },
  { name: "E2E Rep B", email: "e2e-rep-b@test.local", role: "rep" },
] as const

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is not set")

  // 1. Fresh schema.
  const admin = new Client({ connectionString: databaseUrl })
  await admin.connect()
  try {
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`)
    await admin.query(`CREATE SCHEMA ${SCHEMA}`)
  } finally {
    await admin.end()
  }

  // 2. Tables. Prisma selects the schema with its own ?schema= parameter.
  const prismaUrl = new URL(databaseUrl)
  prismaUrl.searchParams.set("schema", SCHEMA)

  const push = spawnSync(
    "npx",
    ["prisma", "db", "push", "--accept-data-loss", "--url", prismaUrl.toString()],
    {
      shell: true,
      encoding: "utf8",
      env: {
        ...process.env,
        // Prisma 7 refuses destructive commands from an AI agent without this.
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
      },
    }
  )
  if (push.status !== 0) {
    throw new Error(`prisma db push failed:\n${push.stdout}\n${push.stderr}`)
  }

  // 3. Fixtures.
  const adapter = new PrismaPg(
    { connectionString: databaseUrl, options: `-c search_path=${SCHEMA}` },
    { schema: SCHEMA }
  )
  const prisma = new PrismaClient({ adapter })
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10)

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, isActive: true },
      create: { ...user, passwordHash },
    })
  }

  // A shared contact so list pages have something to render. Contact.email is
  // indexed but not unique, so this is a plain create — safe because the schema
  // was dropped and recreated above.
  await prisma.contact.create({
    data: {
      name: "E2E Shared Contact",
      email: "e2e-contact@test.local",
      jobTitle: "Head of Testing",
    },
  })

  // A pending extraction so the review queue has something to render. Seeded
  // directly rather than extracted, so the browser suite never calls Claude.
  const repA = await prisma.user.findUnique({
    where: { email: "e2e-rep-a@test.local" },
  })
  const sharedContact = await prisma.contact.findFirst({
    where: { email: "e2e-contact@test.local" },
  })
  const e2eLead = await prisma.lead.create({
    data: {
      name: "E2E Review Lead",
      email: "e2e-review-lead@test.local",
      ownerId: repA!.id,
    },
  })

  await prisma.extraction.create({
    data: {
      userId: repA!.id,
      sourceLabel: "E2E Call Notes",
      rawText: "Seeded transcript for the review queue end-to-end test.",
      summary: "Seeded review batch",
      changes: {
        create: [
          {
            entity: "lead",
            action: "update_field",
            label: "Job title",
            targetId: e2eLead.id,
            field: "jobTitle",
            currentValue: "",
            proposedValue: "Head of Platform",
            evidence: "he runs the platform team",
          },
          {
            entity: "contact",
            action: "update_field",
            label: "Phone",
            targetId: sharedContact!.id,
            field: "phone",
            currentValue: "",
            proposedValue: "+44 20 7946 0123",
            evidence: "reachable on 020 7946 0123",
          },
        ],
      },
    },
  })

  await prisma.$disconnect()
  console.log(
    `E2E schema ${SCHEMA} ready: ${USERS.length} users, 1 contact, 1 pending extraction`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
