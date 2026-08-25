import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  convertLead,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  updateLead,
} from "@/services/leadsService"

export const leadsRouter = Router()

leadsRouter.use(authenticate)

leadsRouter.get("/", async (req, res) => {
  const { leads, ...pagination } = await listLeads(
    req.query,
    req.user!.id,
    req.user!.role
  )
  ok(res, { leads, pagination }, "OK")
})

leadsRouter.post("/", async (req, res) => {
  const lead = await createLead(req.body, req.user!.id, req.user!.role)
  created(res, { lead }, "Lead created")
})

leadsRouter.get("/:id", async (req, res) => {
  const lead = await getLeadById(req.params.id, req.user!.id, req.user!.role)
  ok(res, { lead }, "OK")
})

leadsRouter.patch("/:id", async (req, res) => {
  const lead = await updateLead(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { lead }, "Lead updated")
})

leadsRouter.delete("/:id", async (req, res) => {
  await deleteLead(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Lead deleted")
})

leadsRouter.post("/:id/convert", async (req, res) => {
  const result = await convertLead(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, result, "Lead converted")
})
