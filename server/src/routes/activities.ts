import { Router } from "express"

import * as controller from "@/controllers/activitiesController"
import { authenticate, authorize } from "@/middleware/auth"

export const activitiesRouter = Router()

activitiesRouter.use(authenticate)

// Shared across the workspace: these carry no owner column, so everyone
// reads them. Writes are privileged because a change is visible to the
// whole team.
const canWrite = authorize("admin", "manager")

activitiesRouter.get("/", controller.index)
activitiesRouter.post("/", canWrite, controller.create)
activitiesRouter.get("/:id", controller.show)
activitiesRouter.patch("/:id", canWrite, controller.update)
activitiesRouter.delete("/:id", canWrite, controller.destroy)
