import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "@/services/contactsService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listContacts(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const contact = await createContact(req.body, req.user!.id, req.user!.role)
  created(res, { contact }, "Contact created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const contact = await getContact(req.params.id, req.user!.id, req.user!.role)
  ok(res, { contact }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const contact = await updateContact(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { contact }, "Contact updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteContact(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Contact deleted")
}
