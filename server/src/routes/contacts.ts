import { Router } from "express"

import * as controller from "@/controllers/contactsController"
import { authenticate, authorize } from "@/middleware/auth"

export const contactsRouter = Router()

contactsRouter.use(authenticate)

// Shared across the workspace: these carry no owner column, so everyone
// reads them. Writes are privileged because a change is visible to the
// whole team.
const canWrite = authorize("admin", "manager")

contactsRouter.get("/", controller.index)
contactsRouter.post("/", canWrite, controller.create)
contactsRouter.get("/:id", controller.show)
contactsRouter.patch("/:id", canWrite, controller.update)
contactsRouter.delete("/:id", canWrite, controller.destroy)
