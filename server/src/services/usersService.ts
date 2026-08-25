import type { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export const listUsers = async (
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  // Every authenticated user can list team members for assignment dropdowns.
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarColor: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  })
  return users
}
