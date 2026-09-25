import { Router } from "express"

import * as controller from "@/controllers/automationsController"
import { authenticate } from "@/middleware/auth"
import { requireCronSecret } from "@/middleware/cron"

export const automationsRouter = Router()

// Cron-triggered scan (vercel.json crons). Declared before `authenticate`
// because it carries a shared secret rather than a user session.
automationsRouter.post("/run", requireCronSecret, controller.run)

automationsRouter.use(authenticate)

automationsRouter.get("/", controller.index)
automationsRouter.post("/", controller.create)
automationsRouter.get("/:id", controller.show)
automationsRouter.patch("/:id", controller.update)
automationsRouter.patch("/:id/toggle", controller.toggle)
automationsRouter.post("/:id/test", controller.test)
automationsRouter.get("/:id/runs", controller.indexRuns)
automationsRouter.delete("/:id/runs", controller.clearRuns)
automationsRouter.delete("/:id", controller.destroy)
