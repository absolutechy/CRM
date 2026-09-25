import { Router } from "express"

import * as controller from "@/controllers/activitiesController"
import { authenticate } from "@/middleware/auth"

export const activitiesRouter = Router()

activitiesRouter.use(authenticate)

activitiesRouter.get("/", controller.index)
activitiesRouter.post("/", controller.create)
activitiesRouter.get("/:id", controller.show)
activitiesRouter.patch("/:id", controller.update)
activitiesRouter.delete("/:id", controller.destroy)
