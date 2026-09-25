import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  changeDealStage,
  createDeal,
  deleteDeal,
  getDeal,
  listDeals,
  updateDeal,
} from "@/services/dealsService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listDeals(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const deal = await createDeal(req.body, req.user!.id, req.user!.role)
  created(res, { deal }, "Deal created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const deal = await getDeal(req.params.id, req.user!.id, req.user!.role)
  ok(res, { deal }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const deal = await updateDeal(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { deal }, "Deal updated")
}

export const changeStage = async (req: Request<IdParams>, res: Response) => {
  const deal = await changeDealStage(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { deal }, "Stage updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteDeal(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Deal deleted")
}
