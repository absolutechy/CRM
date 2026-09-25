import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
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

type IdParams = { id: string }
type ContactParams = { contactId: string }

// ---- templates

export const indexTemplates = async (req: Request, res: Response) => {
  const templates = await listEmailTemplates(req.user!.id, req.user!.role)
  ok(res, { templates }, "OK")
}

export const createTemplate = async (req: Request, res: Response) => {
  const template = await createEmailTemplate(req.body, req.user!.id, req.user!.role)
  created(res, { template }, "Template created")
}

export const updateTemplate = async (req: Request<IdParams>, res: Response) => {
  const template = await updateEmailTemplate(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { template }, "Template updated")
}

export const destroyTemplate = async (req: Request<IdParams>, res: Response) => {
  await deleteEmailTemplate(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Template deleted")
}

// ---- accounts

export const indexAccounts = async (req: Request, res: Response) => {
  const accounts = await listEmailAccounts(req.user!.id, req.user!.role)
  ok(res, { accounts }, "OK")
}

export const createAccount = async (req: Request, res: Response) => {
  const account = await createEmailAccount(req.body, req.user!.id, req.user!.role)
  created(res, { account }, "Account added")
}

export const syncAccount = async (req: Request<IdParams>, res: Response) => {
  const account = await syncEmailAccount(
    req.params.id,
    req.user!.id,
    req.user!.role
  )
  ok(res, { account }, "Account synced")
}

// ---- messages

export const index = async (req: Request, res: Response) => {
  const emails = await listEmails(req.user!.id, req.user!.role)
  ok(res, { emails }, "OK")
}

export const indexByContact = async (req: Request<ContactParams>, res: Response) => {
  const emails = await listEmailsByContact(
    req.params.contactId,
    req.user!.id,
    req.user!.role
  )
  ok(res, { emails }, "OK")
}

// ---- send + drafts

export const send = async (req: Request, res: Response) => {
  const result = await sendEmail(req.body, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const createDraft = async (req: Request, res: Response) => {
  const draft = await saveDraft(req.body, req.user!.id, req.user!.role)
  created(res, { draft }, "Draft saved")
}

export const destroyDraft = async (req: Request<IdParams>, res: Response) => {
  await deleteDraft(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Draft deleted")
}
