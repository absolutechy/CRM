import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/services/companiesService"

export const companiesRouter = Router()

companiesRouter.use(authenticate)

companiesRouter.get("/", async (req, res) => {
  const result = await listCompanies(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

companiesRouter.post("/", async (req, res) => {
  const company = await createCompany(req.body, req.user!.id, req.user!.role)
  created(res, { company }, "Company created")
})

companiesRouter.get("/:id", async (req, res) => {
  const company = await getCompany(req.params.id, req.user!.id, req.user!.role)
  ok(res, { company }, "OK")
})

companiesRouter.patch("/:id", async (req, res) => {
  const company = await updateCompany(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { company }, "Company updated")
})

companiesRouter.delete("/:id", async (req, res) => {
  await deleteCompany(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Company deleted")
})
