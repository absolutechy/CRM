import { Router } from "express"

import { ok } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import { listUsers } from "@/services/usersService"

export const usersRouter = Router()

usersRouter.use(authenticate)

usersRouter.get("/", async (req, res) => {
  const users = await listUsers(req.user!.id, req.user!.role)
  ok(res, { users }, "OK")
})
