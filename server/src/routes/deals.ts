import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  changeDealStage,
  createDeal,
  deleteDeal,
  getDeal,
  listDeals,
  updateDeal,
} from "@/services/dealsService"

export const dealsRouter = Router()

dealsRouter.use(authenticate)

dealsRouter.get("/", async (req, res) => {
  const result = await listDeals(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

dealsRouter.post("/", async (req, res) => {
  const deal = await createDeal(req.body, req.user!.id, req.user!.role)
  created(res, { deal }, "Deal created")
})

dealsRouter.get("/:id", async (req, res) => {
  const deal = await getDeal(req.params.id, req.user!.id, req.user!.role)
  ok(res, { deal }, "OK")
})

dealsRouter.patch("/:id", async (req, res) => {
  const deal = await updateDeal(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { deal }, "Deal updated")
})

dealsRouter.patch("/:id/stage", async (req, res) => {
  const deal = await changeDealStage(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { deal }, "Stage updated")
})

dealsRouter.delete("/:id", async (req, res) => {
  await deleteDeal(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Deal deleted")
})
