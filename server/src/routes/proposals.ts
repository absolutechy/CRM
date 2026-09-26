import { Router } from "express"

import * as controller from "@/controllers/proposalsController"
import { authenticate } from "@/middleware/auth"

export const proposalsRouter = Router()

proposalsRouter.use(authenticate)

// No authorize() here: whether a change may be applied depends on the entity it
// targets, which is finer-grained than a route gate. proposalsService.canApplyChange
// makes that call per change.
proposalsRouter.post("/extract", controller.extract)
proposalsRouter.get("/", controller.index)
proposalsRouter.get("/extractions/:id", controller.showExtraction)
proposalsRouter.post("/extractions/:id/approve-all", controller.approveAll)
proposalsRouter.delete("/extractions/:id", controller.destroyExtraction)
proposalsRouter.post("/:id/approve", controller.approve)
proposalsRouter.post("/:id/reject", controller.reject)
