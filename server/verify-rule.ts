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

  const rules = await prisma.automationRule.findMany({
    select: { id: true, name: true, actions: true, triggerEntity: true, triggerEvent: true },
  })
  console.log("RULES:", JSON.stringify(rules, null, 2))

  const lead = await prisma.lead.findFirst({
    where: { id: "cmt8ydr5x0007c0jbm4wctqie" },
    select: { id: true, name: true, ownerId: true },
  })
  console.log("LEAD:", JSON.stringify(lead, null, 2))

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("ERR:", e.message)
  process.exit(1)
})
