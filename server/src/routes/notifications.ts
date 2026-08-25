import { Router } from "express"

import { ok } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  listNotifications,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from "@/services/notificationsService"

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)

notificationsRouter.get("/", async (req, res) => {
  const notifications = await listNotifications(req.user!.id, req.user!.role)
  ok(res, { notifications }, "OK")
})

notificationsRouter.get("/unread-count", async (req, res) => {
  const count = await unreadCount(req.user!.id, req.user!.role)
  ok(res, { count }, "OK")
})

notificationsRouter.patch("/:id/read", async (req, res) => {
  const notification = await markNotificationRead(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { notification }, "Marked read")
})

notificationsRouter.post("/read-all", async (req, res) => {
  await markAllRead(req.user!.id, req.user!.role)
  ok(res, null, "All marked read")
})
