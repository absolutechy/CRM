import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import { createExtraction } from "@/services/extractionService"
import {
  approveChange,
  approveExtraction,
  deleteExtraction,
  getExtraction,
  listProposals,
  rejectChange,
} from "@/services/proposalsService"

type IdParams = { id: string }

/** Runs AI extraction. Writes proposals only — no CRM record is touched. */
export const extract = async (req: Request, res: Response) => {
  const extraction = await createExtraction(req.body, req.user!.id, req.user!.role)
  created(res, { extraction }, "Changes extracted for review")
}

export const index = async (req: Request, res: Response) => {
  const proposals = await listProposals(req.query, req.user!.id, req.user!.role)
  ok(res, { proposals }, "OK")
}

export const showExtraction = async (req: Request<IdParams>, res: Response) => {
  const extraction = await getExtraction(req.params.id, req.user!.id, req.user!.role)
  ok(res, { extraction }, "OK")
}

export const approve = async (req: Request<IdParams>, res: Response) => {
  const change = await approveChange(req.params.id, req.user!.id, req.user!.role)
  ok(res, { change }, "Change applied")
}

export const reject = async (req: Request<IdParams>, res: Response) => {
  const change = await rejectChange(req.params.id, req.user!.id, req.user!.role)
  ok(res, { change }, "Change rejected")
}

export const approveAll = async (req: Request<IdParams>, res: Response) => {
  const result = await approveExtraction(req.params.id, req.user!.id, req.user!.role)
  ok(res, result, `Applied ${result.applied} change${result.applied === 1 ? "" : "s"}`)
}

export const destroyExtraction = async (req: Request<IdParams>, res: Response) => {
  await deleteExtraction(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Extraction discarded")
}
