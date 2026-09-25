import { Router } from "express"

import * as controller from "@/controllers/emailTemplatesController"
import { authenticate } from "@/middleware/auth"

export const emailTemplatesRouter = Router()

emailTemplatesRouter.use(authenticate)

emailTemplatesRouter.get("/", controller.index)
