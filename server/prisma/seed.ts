import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL!,
    options: "-c search_path=crm",
  },
  { schema: "crm" }
)
const prisma = new PrismaClient({ adapter })

/**
 * Bootstrap users for local development, upserted by email.
 * Password for every account: Password123!
 */
const users = [
  {
    name: "John Doe",
    email: "john.doe@ourcrm.com",
    role: "admin" as const,
    avatarColor: "primary",
  },
  {
    name: "Sarah Lee",
    email: "sarah.lee@ourcrm.com",
    role: "manager" as const,
    avatarColor: "info",
  },
  {
    name: "Marcus Chen",
    email: "marcus.chen@ourcrm.com",
    role: "rep" as const,
    avatarColor: "success",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@ourcrm.com",
    role: "rep" as const,
    avatarColor: "warning",
  },
]

const templates = [
  {
    name: "Intro — inbound lead",
    subject: "Thanks for reaching out, {{firstName}}",
    body: "<p>Hi {{firstName}},</p><p>Thanks for your interest.</p>",
    category: "Prospecting",
  },
  {
    name: "Follow-up after demo",
    subject: "Recap + next steps",
    body: "<p>Hi {{firstName}},</p><p>Great speaking with you today.</p>",
    category: "Sales",
  },
  {
    name: "Proposal delivery",
    subject: "Your proposal from {{senderName}}",
    body: "<p>Hi {{firstName}},</p><p>Attached is the proposal.</p>",
    category: "Sales",
  },
]

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12)
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, avatarColor: user.avatarColor },
      create: { ...user, passwordHash },
    })
  }

  for (const template of templates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { name: template.name },
    })
    if (!existing) {
      await prisma.emailTemplate.create({ data: template })
    }
  }
  console.log(`Seeded ${users.length} users and ${templates.length} templates`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
