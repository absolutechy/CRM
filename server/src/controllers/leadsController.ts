import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  convertLead,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  updateLead,
} from "@/services/leadsService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const { leads, ...pagination } = await listLeads(
    req.query,
    req.user!.id,
    req.user!.role
  )
  ok(res, { leads, pagination }, "OK")
}

export const create = async (req: Request, res: Response) => {
  const lead = await createLead(req.body, req.user!.id, req.user!.role)
  created(res, { lead }, "Lead created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const lead = await getLeadById(req.params.id, req.user!.id, req.user!.role)
  ok(res, { lead }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const lead = await updateLead(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { lead }, "Lead updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteLead(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Lead deleted")
}

export const convert = async (req: Request<IdParams>, res: Response) => {
  const result = await convertLead(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, result, "Lead converted")
}
