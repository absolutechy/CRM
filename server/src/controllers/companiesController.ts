import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/services/companiesService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listCompanies(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const company = await createCompany(req.body, req.user!.id, req.user!.role)
  created(res, { company }, "Company created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const company = await getCompany(req.params.id, req.user!.id, req.user!.role)
  ok(res, { company }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const company = await updateCompany(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { company }, "Company updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteCompany(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Company deleted")
}
