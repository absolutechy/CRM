import type { Request, Response } from "express"

import { ok } from "@/lib/http"
import { listEmailTemplates } from "@/services/emailTemplatesService"

export const index = async (req: Request, res: Response) => {
  const templates = await listEmailTemplates(req.user!.id, req.user!.role)
  ok(res, { templates }, "OK")
}
