import { Router } from "express"

import * as controller from "@/controllers/usersController"
import { authenticate } from "@/middleware/auth"

export const usersRouter = Router()

usersRouter.use(authenticate)

usersRouter.get("/", controller.index)
