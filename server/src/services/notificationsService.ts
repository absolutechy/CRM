import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

export const listNotifications = async (
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  return prisma.notification.findMany({
    where: { userId: currentUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export const unreadCount = async (
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  return prisma.notification.count({
    where: { userId: currentUserId, readAt: null },
  })
}

export const markNotificationRead = async (
  id: string,
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  const notification = await prisma.notification.findFirst({
    where: { id, userId: currentUserId },
  })
  if (!notification) throw new Error("Notification not found")

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })
}

export const markAllRead = async (
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  await prisma.notification.updateMany({
    where: { userId: currentUserId, readAt: null },
    data: { readAt: new Date() },
  })
}
