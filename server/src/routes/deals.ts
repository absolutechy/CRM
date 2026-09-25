import { Router } from "express"

import * as controller from "@/controllers/dealsController"
import { authenticate } from "@/middleware/auth"

export const dealsRouter = Router()

dealsRouter.use(authenticate)

dealsRouter.get("/", controller.index)
dealsRouter.post("/", controller.create)
dealsRouter.get("/:id", controller.show)
dealsRouter.patch("/:id", controller.update)
dealsRouter.patch("/:id/stage", controller.changeStage)
dealsRouter.delete("/:id", controller.destroy)
