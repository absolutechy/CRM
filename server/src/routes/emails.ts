import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  createEmailAccount,
  createEmailTemplate,
  deleteDraft,
  deleteEmailTemplate,
  listEmailAccounts,
  listEmails,
  listEmailsByContact,
  listEmailTemplates,
  saveDraft,
  sendEmail,
  syncEmailAccount,
  updateEmailTemplate,
} from "@/services/emailsService"

export const emailsRouter = Router()

emailsRouter.use(authenticate)

// ---- templates
emailsRouter.get("/templates", async (req, res) => {
  const templates = await listEmailTemplates(req.user!.id, req.user!.role)
  ok(res, { templates }, "OK")
})

emailsRouter.post("/templates", async (req, res) => {
  const template = await createEmailTemplate(req.body, req.user!.id, req.user!.role)
  created(res, { template }, "Template created")
})

emailsRouter.patch("/templates/:id", async (req, res) => {
  const template = await updateEmailTemplate(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { template }, "Template updated")
})

emailsRouter.delete("/templates/:id", async (req, res) => {
  await deleteEmailTemplate(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Template deleted")
})

// ---- accounts
emailsRouter.get("/accounts", async (req, res) => {
  const accounts = await listEmailAccounts(req.user!.id, req.user!.role)
  ok(res, { accounts }, "OK")
})

emailsRouter.post("/accounts", async (req, res) => {
  const account = await createEmailAccount(req.body, req.user!.id, req.user!.role)
  created(res, { account }, "Account added")
})

emailsRouter.post("/accounts/:id/sync", async (req, res) => {
  const account = await syncEmailAccount(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { account }, "Account synced")
})

// ---- messages
emailsRouter.get("/", async (req, res) => {
  const emails = await listEmails(req.user!.id, req.user!.role)
  ok(res, { emails }, "OK")
})

emailsRouter.get("/contact/:contactId", async (req, res) => {
  const emails = await listEmailsByContact(
    req.params.contactId,
    req.user!.id,
    req.user!.role
  )
  ok(res, { emails }, "OK")
})

// ---- send + drafts
emailsRouter.post("/send", async (req, res) => {
  const result = await sendEmail(req.body, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

emailsRouter.post("/drafts", async (req, res) => {
  const draft = await saveDraft(req.body, req.user!.id, req.user!.role)
  created(res, { draft }, "Draft saved")
})

emailsRouter.delete("/drafts/:id", async (req, res) => {
  await deleteDraft(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Draft deleted")
})
