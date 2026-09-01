import { Router } from "express"

import { ok, created, ApiError } from "@/lib/http"
import { env } from "@/config/env"
import { authenticate } from "@/middleware/auth"
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

export const automationsRouter = Router()

/**
 * Triggered by Vercel's cron (vercel.json crons) to run the time-based scan.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; verified here instead of
 * the user auth middleware because cron has no user session.
 */
automationsRouter.post("/run", async (req, res) => {
  const auth = req.headers.authorization ?? ""
  const secret = env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    throw ApiError.unauthorized("Invalid cron secret")
  }

  await scanInactiveRecords()
  ok(res, { ran: true }, "Automation scan complete")
})

automationsRouter.use(authenticate)

automationsRouter.get("/", async (req, res) => {
  const rules = await listAutomationRules(req.user!.id, req.user!.role)
  ok(res, { rules }, "OK")
})

automationsRouter.post("/", async (req, res) => {
  const rule = await createAutomationRule(req.body, req.user!.id, req.user!.role)
  created(res, { rule }, "Rule created")
})

automationsRouter.get("/:id", async (req, res) => {
  const rule = await getAutomationRule(req.params.id, req.user!.id, req.user!.role)
  ok(res, { rule }, "OK")
})

automationsRouter.patch("/:id", async (req, res) => {
  const rule = await updateAutomationRule(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { rule }, "Rule updated")
})

automationsRouter.patch("/:id/toggle", async (req, res) => {
  const rule = await toggleAutomationRule(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { rule }, "Rule toggled")
})

automationsRouter.post("/:id/test", async (req, res) => {
  const result = await testAutomationRule(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, result, "OK")
})

automationsRouter.get("/:id/runs", async (req, res) => {
  const runs = await listAutomationRuns(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { runs }, "OK")
})

automationsRouter.delete("/:id/runs", async (req, res) => {
  await clearAutomationRuns(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Runs cleared")
})

automationsRouter.delete("/:id", async (req, res) => {
  await deleteAutomationRule(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Rule deleted")
})
