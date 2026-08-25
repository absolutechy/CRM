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

  const templates = await prisma.emailTemplate.findMany()
  console.log(
    "TEMPLATES:",
    JSON.stringify(templates.map((t) => ({ id: t.id, name: t.name })))
  )
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("ERR:", e.message)
  process.exit(1)
})
