import { Router } from "express"

import * as controller from "@/controllers/healthController"

export const healthRouter: Router = Router()

healthRouter.get("/", controller.show)
