import { Router } from "express"

import * as controller from "@/controllers/contactsController"
import { authenticate } from "@/middleware/auth"

export const contactsRouter = Router()

contactsRouter.use(authenticate)

contactsRouter.get("/", controller.index)
contactsRouter.post("/", controller.create)
contactsRouter.get("/:id", controller.show)
contactsRouter.patch("/:id", controller.update)
contactsRouter.delete("/:id", controller.destroy)
