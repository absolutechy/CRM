import type { Request, Response } from "express"

import { ok } from "@/lib/http"
import { listUsers } from "@/services/usersService"

export const index = async (req: Request, res: Response) => {
  const users = await listUsers(req.user!.id, req.user!.role)
  ok(res, { users }, "OK")
}
