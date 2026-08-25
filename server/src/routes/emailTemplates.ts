import { Router } from "express"

import { ok } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import { listEmailTemplates } from "@/services/emailTemplatesService"

export const emailTemplatesRouter = Router()

emailTemplatesRouter.use(authenticate)

emailTemplatesRouter.get("/", async (req, res) => {
  const templates = await listEmailTemplates(req.user!.id, req.user!.role)
  ok(res, { templates }, "OK")
})
