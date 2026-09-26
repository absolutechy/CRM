import { Router } from "express"

import * as controller from "@/controllers/companiesController"
import { authenticate, authorize } from "@/middleware/auth"

export const companiesRouter = Router()

companiesRouter.use(authenticate)

// Shared across the workspace: these carry no owner column, so everyone
// reads them. Writes are privileged because a change is visible to the
// whole team.
const canWrite = authorize("admin", "manager")

companiesRouter.get("/", controller.index)
companiesRouter.post("/", canWrite, controller.create)
companiesRouter.get("/:id", controller.show)
companiesRouter.patch("/:id", canWrite, controller.update)
companiesRouter.delete("/:id", canWrite, controller.destroy)
