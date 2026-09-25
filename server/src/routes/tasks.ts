import { Router } from "express"

import * as controller from "@/controllers/tasksController"
import { authenticate } from "@/middleware/auth"

export const tasksRouter = Router()

tasksRouter.use(authenticate)

tasksRouter.get("/", controller.index)
tasksRouter.post("/", controller.create)
tasksRouter.get("/:id", controller.show)
tasksRouter.patch("/:id", controller.update)
tasksRouter.patch("/:id/status", controller.changeStatus)
tasksRouter.delete("/:id", controller.destroy)
