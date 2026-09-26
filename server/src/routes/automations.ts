import { Router } from "express"

import * as controller from "@/controllers/automationsController"
import { authenticate, authorize } from "@/middleware/auth"
import { requireCronSecret } from "@/middleware/cron"

export const automationsRouter = Router()

// Cron-triggered scan (vercel.json crons). Declared before `authenticate`
// because it carries a shared secret rather than a user session.
automationsRouter.post("/run", requireCronSecret, controller.run)

automationsRouter.use(authenticate)

// Rules fire for the whole organisation and have no owner, so any change a
// rep made would silently affect everyone's records. Reads stay open.
const canWrite = authorize("admin", "manager")

automationsRouter.get("/", controller.index)
automationsRouter.post("/", canWrite, controller.create)
automationsRouter.get("/:id", controller.show)
automationsRouter.patch("/:id", canWrite, controller.update)
automationsRouter.patch("/:id/toggle", canWrite, controller.toggle)
automationsRouter.post("/:id/test", canWrite, controller.test)
automationsRouter.get("/:id/runs", controller.indexRuns)
automationsRouter.delete("/:id/runs", canWrite, controller.clearRuns)
automationsRouter.delete("/:id", canWrite, controller.destroy)
