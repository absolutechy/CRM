import { Router } from "express"

import * as controller from "@/controllers/notificationsController"
import { authenticate } from "@/middleware/auth"

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)

notificationsRouter.get("/", controller.index)
notificationsRouter.get("/unread-count", controller.getUnreadCount)
notificationsRouter.patch("/:id/read", controller.markRead)
notificationsRouter.post("/read-all", controller.readAll)
