import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import "dotenv/config"

async function main() {
  const adapter = new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL!,
      options: "-c search_path=crm",
    },
    { schema: "crm" }
  )
  const prisma = new PrismaClient({ adapter })

  const runs = await prisma.automationRun.findMany({
    orderBy: { ranAt: "desc" },
    take: 5,
  })
  console.log("RUNS:", JSON.stringify(runs, null, 2))

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })
  console.log("NOTIFICATIONS:", JSON.stringify(notifications, null, 2))

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  })
  console.log("USERS:", JSON.stringify(users, null, 2))

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("ERR:", e.message)
  process.exit(1)
})
