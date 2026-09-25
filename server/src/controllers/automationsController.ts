import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import { scanInactiveRecords } from "@/automations/scheduler"
import {
  clearAutomationRuns,
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRule,
  listAutomationRuns,
  listAutomationRules,
  testAutomationRule,
  toggleAutomationRule,
  updateAutomationRule,
} from "@/services/automationsService"

type IdParams = { id: string }

/** Cron entry point. Authorised by `requireCronSecret`, not by a user session. */
export const run = async (_req: Request, res: Response) => {
  await scanInactiveRecords()
  ok(res, { ran: true }, "Automation scan complete")
}

export const index = async (req: Request, res: Response) => {
  const rules = await listAutomationRules(req.user!.id, req.user!.role)
  ok(res, { rules }, "OK")
}

export const create = async (req: Request, res: Response) => {
  const rule = await createAutomationRule(req.body, req.user!.id, req.user!.role)
  created(res, { rule }, "Rule created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const rule = await getAutomationRule(req.params.id, req.user!.id, req.user!.role)
  ok(res, { rule }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const rule = await updateAutomationRule(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { rule }, "Rule updated")
}

export const toggle = async (req: Request<IdParams>, res: Response) => {
  const rule = await toggleAutomationRule(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { rule }, "Rule toggled")
}

export const test = async (req: Request<IdParams>, res: Response) => {
  const result = await testAutomationRule(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, result, "OK")
}

export const indexRuns = async (req: Request<IdParams>, res: Response) => {
  const runs = await listAutomationRuns(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { runs }, "OK")
}

export const clearRuns = async (req: Request<IdParams>, res: Response) => {
  await clearAutomationRuns(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Runs cleared")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteAutomationRule(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Rule deleted")
}
