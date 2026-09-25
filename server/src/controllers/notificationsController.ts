import type { Request, Response } from "express"

import { ok } from "@/lib/http"
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from "@/services/notificationsService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const notifications = await listNotifications(req.user!.id, req.user!.role)
  ok(res, { notifications }, "OK")
}

export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await unreadCount(req.user!.id, req.user!.role)
  ok(res, { count }, "OK")
}

export const markRead = async (req: Request<IdParams>, res: Response) => {
  const notification = await markNotificationRead(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { notification }, "Marked read")
}

export const readAll = async (req: Request, res: Response) => {
  await markAllRead(req.user!.id, req.user!.role)
  ok(res, null, "All marked read")
}
