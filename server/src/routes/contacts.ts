import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "@/services/contactsService"

export const contactsRouter = Router()

contactsRouter.use(authenticate)

contactsRouter.get("/", async (req, res) => {
  const result = await listContacts(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

contactsRouter.post("/", async (req, res) => {
  const contact = await createContact(req.body, req.user!.id, req.user!.role)
  created(res, { contact }, "Contact created")
})

contactsRouter.get("/:id", async (req, res) => {
  const contact = await getContact(req.params.id, req.user!.id, req.user!.role)
  ok(res, { contact }, "OK")
})

contactsRouter.patch("/:id", async (req, res) => {
  const contact = await updateContact(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { contact }, "Contact updated")
})

contactsRouter.delete("/:id", async (req, res) => {
  await deleteContact(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Contact deleted")
})
