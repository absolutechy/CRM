import { Router } from "express"

import * as controller from "@/controllers/leadsController"
import { authenticate } from "@/middleware/auth"

export const leadsRouter = Router()

leadsRouter.use(authenticate)

leadsRouter.get("/", controller.index)
leadsRouter.post("/", controller.create)
leadsRouter.get("/:id", controller.show)
leadsRouter.patch("/:id", controller.update)
leadsRouter.delete("/:id", controller.destroy)
leadsRouter.post("/:id/convert", controller.convert)
