import { Router } from "express"

import * as controller from "@/controllers/campaignsController"
import { authenticate } from "@/middleware/auth"

export const campaignsRouter = Router()

campaignsRouter.use(authenticate)

campaignsRouter.get("/", controller.index)
campaignsRouter.post("/", controller.create)
campaignsRouter.get("/:id", controller.show)
campaignsRouter.patch("/:id", controller.update)
campaignsRouter.delete("/:id", controller.destroy)

// ---- members
campaignsRouter.get("/:id/members", controller.indexMembers)
campaignsRouter.post("/:id/members", controller.createMembers)
campaignsRouter.patch("/:id/members/:memberId", controller.updateMember)
campaignsRouter.delete("/:id/members/:memberId", controller.destroyMember)
