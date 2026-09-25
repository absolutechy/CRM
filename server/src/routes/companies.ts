import { Router } from "express"

import * as controller from "@/controllers/companiesController"
import { authenticate } from "@/middleware/auth"

export const companiesRouter = Router()

companiesRouter.use(authenticate)

companiesRouter.get("/", controller.index)
companiesRouter.post("/", controller.create)
companiesRouter.get("/:id", controller.show)
companiesRouter.patch("/:id", controller.update)
companiesRouter.delete("/:id", controller.destroy)
