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

  const users = await prisma.user.findMany({
    select: { email: true, role: true },
  })
  console.log(JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
